const cloud = require('wx-server-sdk')
const crypto = require('node:crypto')
const { summarize } = require('./lib/assessment')
const { BUSINESS_TYPES, ROLES, DIAGNOSIS_TYPES, FOLLOW_UP_STATES, requiredText, optionalText, mobile, choice, positiveCents } = require('./lib/validate')
const { renderReportPdf } = require('./lib/reportPdf')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const C = {
  leads: db.collection('assessment_leads'),
  applications: db.collection('diagnosis_applications'),
  projects: db.collection('diagnosis_projects'),
  invites: db.collection('report_invites'),
  settings: db.collection('assessment_settings'),
  audit: db.collection('assessment_audit')
}

function now() { return new Date().toISOString() }
function admins() { return (process.env.ADMIN_OPENIDS || '').split(',').map(s => s.trim()).filter(Boolean) }
function assertAdmin(openid) { if (!admins().includes(openid)) throw new Error('没有管理权限') }
function assertId(id) { return requiredText(id, '记录编号', 80) }
function unique(values) { return [...new Set(values)] }
async function one(collection, id) {
  const res = await collection.doc(assertId(id)).get()
  return res.data || null
}
async function audit(action, openid, target, detail) {
  await C.audit.add({ data: { action, openid, target, detail: detail || '', at: now() } })
}
async function settings() {
  try { return await one(C.settings, 'public') || {} } catch (_) { return {} }
}
function publicSettings(s) {
  return { contactWechat: s.contactWechat || '', contactPhone: s.contactPhone || '', operatorName: s.operatorName || '上海恒越禾生物医药有限公司', noticeVersion: s.noticeVersion || '1.0', retentionPolicy: s.retentionPolicy || '', privacyPublished: s.privacyPublished === true, paymentEnabled: false }
}
function safeProject(p, isRecipient) {
  return {
    id: p._id, type: p.type, title: p.title, scope: p.scope,
    quoteCents: p.quoteCents, quoteStatus: p.quoteStatus,
    paymentStatus: p.paymentStatus, serviceStatus: p.serviceStatus,
    invoiceStatus: p.invoiceStatus, reportStatus: isRecipient ? p.reportStatus : 'restricted',
    createdAt: p.createdAt, updatedAt: p.updatedAt
  }
}

async function submitAssessment(openid, input) {
  const config = await settings()
  if (config.privacyPublished !== true || !config.retentionPolicy || !config.contactPhone) throw new Error('信息使用说明尚未配置，暂不能提交')
  const businessType = choice(input.businessType, BUSINESS_TYPES, '企业类型')
  const role = choice(input.role, ROLES, '岗位')
  if (input.noticeAccepted !== true || input.callbackAcknowledged !== true) throw new Error('请先阅读并确认信息使用与回访说明')
  const lead = {
    openid, businessType, role,
    companyName: requiredText(input.companyName, '企业名称', 100),
    contactName: requiredText(input.contactName, '联系人姓名', 40),
    jobTitle: requiredText(input.jobTitle, '联系人职位', 60),
    phone: mobile(input.phone),
    wechat: optionalText(input.wechat, 60),
    marketingOptIn: input.marketingOptIn === true,
    noticeVersion: requiredText(config.noticeVersion || '1.0', '告知版本', 20),
    answers: input.answers,
    result: summarize(input.answers, businessType, role),
    followUpStatus: 'pending', followUpNotes: [],
    createdAt: now(), updatedAt: now()
  }
  const added = await C.leads.add({ data: lead })
  return { id: added._id, result: lead.result }
}

async function ownLead(openid, id) {
  const lead = await one(C.leads, id)
  if (!lead || lead.openid !== openid) throw new Error('记录不存在或无权查看')
  return lead
}

async function submitApplication(openid, input) {
  const lead = await ownLead(openid, input.leadId)
  const application = {
    openid, leadId: lead._id, companyName: lead.companyName, businessType: lead.businessType,
    contactName: lead.contactName, phone: lead.phone,
    type: choice(input.type, DIAGNOSIS_TYPES, '诊断类型'),
    issue: requiredText(input.issue, '问题简述', 1000),
    scope: optionalText(input.scope, 500),
    preferredContactTime: optionalText(input.preferredContactTime, 100),
    status: 'new', createdAt: now(), updatedAt: now()
  }
  const added = await C.applications.add({ data: application })
  return { id: added._id }
}

async function adminCreateProject(openid, input) {
  const app = await one(C.applications, input.applicationId)
  if (!app) throw new Error('诊断申请不存在')
  const project = {
    applicationId: app._id, applicantOpenid: app.openid, businessType: app.businessType,
    buyerName: requiredText(input.buyerName, '购买方企业', 100),
    buyerTaxId: optionalText(input.buyerTaxId, 30),
    type: choice(input.type || app.type, new Set(['remote', 'onsite']), '诊断类型'),
    title: requiredText(input.title, '项目名称', 120),
    scope: requiredText(input.scope, '诊断范围', 3000),
    deliverables: requiredText(input.deliverables, '交付物', 2000),
    quoteCents: positiveCents(input.quoteCents), quoteVersion: 1,
    quoteStatus: 'draft', paymentStatus: 'unpaid', serviceStatus: 'scoping',
    invoiceStatus: 'not_requested', recipients: [], externalDeliveries: [], reportStatus: 'none',
    reportDraft: null, reportFileId: '', reportVersion: 0, previewFileId: '', previewVersion: 0,
    createdAt: now(), updatedAt: now()
  }
  const added = await C.projects.add({ data: project })
  await C.applications.doc(app._id).update({ data: { status: 'project_created', updatedAt: now() } })
  await audit('create_project', openid, added._id)
  return { id: added._id }
}

async function adminUpdateProject(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p) throw new Error('项目不存在')
  const updates = { updatedAt: now() }
  if (input.quoteStatus !== undefined) {
    updates.quoteStatus = choice(input.quoteStatus, new Set(['draft', 'sent', 'accepted', 'declined']), '报价状态')
    if (updates.quoteStatus === 'accepted') updates.acceptanceReference = requiredText(input.acceptanceReference, '合同或报价确认依据', 120)
  }
  if (input.serviceStatus !== undefined) updates.serviceStatus = choice(input.serviceStatus, new Set(['scoping', 'in_progress', 'review', 'delivered', 'closed']), '服务状态')
  if (input.invoiceStatus !== undefined) updates.invoiceStatus = choice(input.invoiceStatus, new Set(['not_requested', 'requested', 'issued']), '开票状态')
  if (input.scope !== undefined || input.deliverables !== undefined || input.quoteCents !== undefined) {
    if (p.quoteStatus === 'accepted' || p.paymentStatus !== 'unpaid') throw new Error('已接受或已收款的报价不能静默修改，请另建变更记录')
    if (input.scope !== undefined) updates.scope = requiredText(input.scope, '诊断范围', 3000)
    if (input.deliverables !== undefined) updates.deliverables = requiredText(input.deliverables, '交付物', 2000)
    if (input.quoteCents !== undefined) updates.quoteCents = positiveCents(input.quoteCents)
    updates.quoteVersion = p.quoteVersion + 1
    updates.quoteStatus = 'draft'
  }
  await C.projects.doc(p._id).update({ data: updates })
  await audit('update_project', openid, p._id, Object.keys(updates).join(','))
  return { id: p._id }
}

async function adminConfirmTransfer(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p) throw new Error('项目不存在')
  if (p.quoteStatus !== 'accepted') throw new Error('客户尚未确认报价')
  if (p.paymentStatus === 'paid') throw new Error('项目已标记到账')
  const reference = requiredText(input.bankReference, '银行到账流水参考', 120)
  await C.projects.doc(p._id).update({ data: { paymentStatus: 'paid', paymentMethod: 'bank_transfer', paidCents: p.quoteCents, paidAt: now(), bankReference: reference, confirmedBy: openid, updatedAt: now() } })
  await audit('confirm_bank_transfer', openid, p._id, reference)
  return { id: p._id }
}

async function adminUpdateLead(openid, input) {
  const lead = await one(C.leads, input.id)
  if (!lead) throw new Error('线索不存在')
  const status = choice(input.status, FOLLOW_UP_STATES, '跟进状态')
  const note = optionalText(input.note, 1000)
  await C.leads.doc(lead._id).update({ data: {
    followUpStatus: status,
    followUpNotes: [...(lead.followUpNotes || []), { at: now(), by: openid, status, note }].slice(-30),
    updatedAt: now()
  } })
  await audit('update_lead', openid, lead._id, status)
  return { id: lead._id }
}

async function adminCreateInvite(openid, input) {
  const p = await one(C.projects, input.projectId)
  if (!p) throw new Error('项目不存在')
  const recipientName = requiredText(input.recipientName, '接收人姓名', 60)
  const recipientPhone = mobile(input.recipientPhone)
  const authorizationReference = requiredText(input.authorizationReference, '购买方授权依据', 240)
  const code = crypto.randomBytes(16).toString('hex')
  const hash = crypto.createHash('sha256').update(code).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await C.invites.add({ data: { projectId: p._id, codeHash: hash, recipientName, recipientPhone, authorizationReference, status: 'new', expiresAt, createdBy: openid, createdAt: now() } })
  await audit('create_report_invite', openid, p._id, recipientName)
  return { code, expiresAt, recipientName }
}

async function redeemInvite(openid, input) {
  const code = requiredText(input.code, '邀请码', 64).toLowerCase()
  const phone = mobile(input.phone)
  const hash = crypto.createHash('sha256').update(code).digest('hex')
  const found = await C.invites.where({ codeHash: hash, status: 'new' }).limit(1).get()
  const invite = found.data && found.data[0]
  if (!invite || invite.expiresAt < now() || invite.recipientPhone !== phone) throw new Error('邀请码或指定手机号无效、已使用或已过期')
  const p = await one(C.projects, invite.projectId)
  if (!p) throw new Error('项目不存在')
  await C.projects.doc(p._id).update({ data: { recipients: unique([...(p.recipients || []), openid]), updatedAt: now() } })
  await C.invites.doc(invite._id).update({ data: { status: 'used', usedBy: openid, usedAt: now() } })
  await audit('redeem_report_invite', openid, p._id, invite.recipientName)
  return { projectId: p._id }
}

async function adminRevokeRecipient(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p) throw new Error('项目不存在')
  const recipientOpenid = requiredText(input.recipientOpenid, '接收人微信身份', 120)
  const authorizationReference = requiredText(input.authorizationReference, '购买方撤销授权依据', 240)
  if (!(p.recipients || []).includes(recipientOpenid)) throw new Error('该接收人未获授权')
  await C.projects.doc(p._id).update({ data: { recipients: p.recipients.filter(x => x !== recipientOpenid), updatedAt: now() } })
  await audit('revoke_report_recipient', openid, p._id, `${recipientOpenid}; ${authorizationReference}`)
  return { id: p._id }
}

async function adminSaveDeepAssessment(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p) throw new Error('项目不存在')
  if (p.paymentStatus !== 'paid') throw new Error('确认正式合作和收款后才能记录深入访谈')
  const source = input.responses
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('深入访谈数据无效')
  const responses = {}
  for (let n = 1; n <= 16; n++) {
    const id = `D${n}`
    const item = source[id] || {}
    const answer = optionalText(item.answer, 2000)
    const evidenceSource = optionalText(item.source, 300)
    const period = optionalText(item.period, 100)
    const currency = optionalText(item.currency, 30)
    if (answer && !evidenceSource) throw new Error(`${id} 请注明资料来源或访谈对象`)
    if (answer && ['D7', 'D9'].includes(id) && (!period || !currency)) throw new Error(`${id} 请注明统计期间和币种；无数据可暂不填`)
    responses[id] = { answer, source: evidenceSource, period, currency }
  }
  if (Object.keys(source).some(id => !/^D([1-9]|1[0-6])$/.test(id))) throw new Error('深入访谈含未知题号')
  await C.projects.doc(p._id).update({ data: { deepResponses: responses, deepUpdatedAt: now(), deepUpdatedBy: openid, updatedAt: now() } })
  await audit('save_deep_assessment', openid, p._id)
  return { id: p._id }
}

async function adminSaveDraft(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p) throw new Error('项目不存在')
  if (p.paymentStatus !== 'paid') throw new Error('未确认收款，不能发布正式诊断报告')
  const draft = input.draft || {}
  const clean = {
    summary: requiredText(draft.summary, '结论摘要', 5000),
    evidence: requiredText(draft.evidence, '证据与来源', 5000),
    risks: requiredText(draft.risks, '风险与待核实事项', 5000),
    actions: requiredText(draft.actions, '建议行动', 5000),
    inventoryNote: optionalText(draft.inventoryNote, 3000),
    limits: optionalText(draft.limits, 3000)
  }
  await C.projects.doc(p._id).update({ data: { reportDraft: clean, previewFileId: '', reportStatus: p.reportFileId ? 'published' : 'draft', updatedAt: now() } })
  await audit('save_report_draft', openid, p._id)
  return { id: p._id }
}

async function adminPreviewReport(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p || !p.reportDraft) throw new Error('请先保存报告工作稿')
  if (p.paymentStatus !== 'paid') throw new Error('未确认收款')
  const version = (p.reportVersion || 0) + 1
  const pdf = await renderReportPdf({ ...p, version, generatedAt: now() })
  const path = `assessment-report-previews/${p._id}/v${version}-${Date.now()}.pdf`
  const uploaded = await cloud.uploadFile({ cloudPath: path, fileContent: pdf })
  await C.projects.doc(p._id).update({ data: { previewFileId: uploaded.fileID, previewVersion: version, reportStatus: p.reportFileId ? 'published' : 'review', updatedAt: now() } })
  const urls = await cloud.getTempFileURL({ fileList: [uploaded.fileID] })
  await audit('preview_report', openid, p._id, `v${version}`)
  const item = urls.fileList && urls.fileList[0]
  if (!item || !item.tempFileURL) throw new Error('PDF 预览链接生成失败')
  return { id: p._id, version, url: item.tempFileURL }
}

async function adminPublishReport(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p || !p.previewFileId || !['review', 'published'].includes(p.reportStatus)) throw new Error('请先生成并审阅 PDF 预览')
  if (p.paymentStatus !== 'paid') throw new Error('未确认收款')
  if (!(p.recipients || []).length) throw new Error('请先由购买方指定报告接收人')
  const version = p.previewVersion
  const approvedAt = now()
  const pdf = await renderReportPdf({ ...p, version, approvedAt, generatedAt: approvedAt })
  const path = `assessment-reports/${p._id}/v${version}-${Date.now()}.pdf`
  const uploaded = await cloud.uploadFile({ cloudPath: path, fileContent: pdf })
  await C.projects.doc(p._id).update({ data: { reportFileId: uploaded.fileID, reportVersion: version, previewFileId: '', reportStatus: 'published', approvedBy: openid, approvedAt, updatedAt: approvedAt } })
  await audit('publish_report', openid, p._id, `v${version}`)
  return { id: p._id, version }
}

async function reportUrl(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p || p.reportStatus !== 'published' || !(p.recipients || []).includes(openid)) throw new Error('报告不存在或未授权')
  const urls = await cloud.getTempFileURL({ fileList: [p.reportFileId] })
  const item = urls.fileList && urls.fileList[0]
  if (!item || !item.tempFileURL) throw new Error('暂时无法打开报告')
  await audit('view_report', openid, p._id, `v${p.reportVersion}`)
  return { url: item.tempFileURL, title: p.title, version: p.reportVersion }
}

async function adminPublishedReportUrl(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p || p.reportStatus !== 'published' || !p.reportFileId) throw new Error('正式报告尚未发布')
  const urls = await cloud.getTempFileURL({ fileList: [p.reportFileId] })
  const item = urls.fileList && urls.fileList[0]
  if (!item || !item.tempFileURL) throw new Error('暂时无法打开正式报告')
  await audit('admin_open_published_report', openid, p._id, `v${p.reportVersion}`)
  return { url: item.tempFileURL, title: p.title, version: p.reportVersion }
}

async function adminRecordExternalDelivery(openid, input) {
  const p = await one(C.projects, input.id)
  if (!p || p.reportStatus !== 'published') throw new Error('正式报告尚未发布')
  const channel = choice(input.channel, new Set(['wechat', 'wecom']), '发送渠道')
  const recipientName = requiredText(input.recipientName, '外发接收人', 60)
  const authorizationReference = requiredText(input.authorizationReference, '购买方授权依据', 240)
  const delivery = { at: now(), by: openid, channel, recipientName, authorizationReference, version: p.reportVersion }
  await C.projects.doc(p._id).update({ data: { externalDeliveries: [...(p.externalDeliveries || []), delivery].slice(-100), updatedAt: now() } })
  await audit('record_external_delivery', openid, p._id, `${channel}; ${recipientName}; v${p.reportVersion}`)
  return { id: p._id, version: p.reportVersion }
}

async function main(event, context) {
  const openid = cloud.getWXContext().OPENID
  if (!openid) return { ok: false, error: '无法确认微信身份' }
  const action = event && event.action
  const input = event && event.data || {}
  try {
    let data
    switch (action) {
      case 'bootstrap': data = { openid, isAdmin: admins().includes(openid), settings: publicSettings(await settings()) }; break
      case 'submitAssessment': data = await submitAssessment(openid, input); break
      case 'myAssessments': data = (await C.leads.where({ openid }).orderBy('createdAt', 'desc').limit(30).get()).data.map(x => ({ id: x._id, companyName: x.companyName, createdAt: x.createdAt, result: x.result })); break
      case 'getAssessment': { const x = await ownLead(openid, input.id); data = { id: x._id, companyName: x.companyName, createdAt: x.createdAt, result: x.result }; break }
      case 'submitApplication': data = await submitApplication(openid, input); break
      case 'myApplications': data = (await C.applications.where({ openid }).orderBy('createdAt', 'desc').limit(30).get()).data; break
      case 'myProjects': {
        const list = (await C.projects.where({ recipients: db.command.all([openid]) }).limit(30).get()).data
        data = list.map(p => safeProject(p, true)); break
      }
      case 'redeemInvite': data = await redeemInvite(openid, input); break
      case 'getReportUrl': data = await reportUrl(openid, input); break
      case 'adminListLeads': assertAdmin(openid); data = (await C.leads.orderBy('createdAt', 'desc').limit(100).get()).data; break
      case 'adminGetLead': assertAdmin(openid); data = await one(C.leads, input.id); break
      case 'adminUpdateLead': assertAdmin(openid); data = await adminUpdateLead(openid, input); break
      case 'adminListApplications': assertAdmin(openid); data = (await C.applications.orderBy('createdAt', 'desc').limit(100).get()).data; break
      case 'adminGetApplication': assertAdmin(openid); data = await one(C.applications, input.id); break
      case 'adminCreateProject': assertAdmin(openid); data = await adminCreateProject(openid, input); break
      case 'adminListProjects': assertAdmin(openid); data = (await C.projects.orderBy('createdAt', 'desc').limit(100).get()).data.map(p => ({ ...safeProject(p, true), buyerName: p.buyerName, recipientCount: (p.recipients || []).length })); break
      case 'adminGetProject': assertAdmin(openid); data = await one(C.projects, input.id); break
      case 'adminUpdateProject': assertAdmin(openid); data = await adminUpdateProject(openid, input); break
      case 'adminConfirmTransfer': assertAdmin(openid); data = await adminConfirmTransfer(openid, input); break
      case 'adminCreateInvite': assertAdmin(openid); data = await adminCreateInvite(openid, input); break
      case 'adminRevokeRecipient': assertAdmin(openid); data = await adminRevokeRecipient(openid, input); break
      case 'adminSaveDeepAssessment': assertAdmin(openid); data = await adminSaveDeepAssessment(openid, input); break
      case 'adminSaveDraft': assertAdmin(openid); data = await adminSaveDraft(openid, input); break
      case 'adminPreviewReport': assertAdmin(openid); data = await adminPreviewReport(openid, input); break
      case 'adminPublishReport': assertAdmin(openid); data = await adminPublishReport(openid, input); break
      case 'adminGetPublishedReportUrl': assertAdmin(openid); data = await adminPublishedReportUrl(openid, input); break
      case 'adminRecordExternalDelivery': assertAdmin(openid); data = await adminRecordExternalDelivery(openid, input); break
      case 'adminSettings': assertAdmin(openid); {
        if (input.privacyPublished === true && (!input.retentionPolicy || !input.contactPhone)) throw new Error('发布前请填写保存期限与联系电话')
        const s = {
          contactWechat: optionalText(input.contactWechat, 80),
          contactPhone: optionalText(input.contactPhone, 30),
          operatorName: requiredText(input.operatorName || '上海恒越禾生物医药有限公司', '运营主体', 100),
          noticeVersion: requiredText(input.noticeVersion || '1.0', '告知版本', 20),
          retentionPolicy: optionalText(input.retentionPolicy, 300),
          privacyPublished: input.privacyPublished === true,
          updatedAt: now()
        }
        await C.settings.doc('public').set({ data: s }); await audit('update_settings', openid, 'public'); data = publicSettings(s); break
      }
      default: throw new Error('未知操作')
    }
    return { ok: true, data }
  } catch (error) {
    console.error('assessmentApi error', action, error)
    return { ok: false, error: error.message || '操作失败' }
  }
}

exports.main = main
