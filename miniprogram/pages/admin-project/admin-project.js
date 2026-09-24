const { api, message } = require('../../utils/api')
const TYPES = [{ value: 'remote', label: '远程单一问题' }, { value: 'onsite', label: '现场全链路' }]

Page({
  data: {
    mode: 'create', application: null, project: null, showBankConfirm: false, types: TYPES, typeIndex: 0, busy: false,
    form: { buyerName: '', buyerTaxId: '', title: '', scope: '', deliverables: '', quoteYuan: '' },
    acceptanceReference: '', bankReference: '', inviteName: '', invitePhone: '', inviteAuthorization: '', revokeAuthorization: '', inviteCode: '', deliveryName: '', deliveryAuthorization: '', deliveryChannel: 'wechat',
    draft: { summary: '', evidence: '', risks: '', actions: '', inventoryNote: '', limits: '' }
  },
  async onLoad(options) {
    this.projectId = options.id
    this.applicationId = options.applicationId
    if (this.projectId) { this.setData({ mode: 'detail' }); await this.refresh() }
    else if (this.applicationId) {
      try {
        const application = await api('adminGetApplication', { id: this.applicationId })
        this.setData({ application, form: { buyerName: application.companyName, buyerTaxId: '', title: `${application.companyName}供应链诊断`, scope: application.scope || application.issue, deliverables: '诊断结论、证据与待核实事项、优先行动建议', quoteYuan: '' }, typeIndex: application.type === 'onsite' ? 1 : 0 })
      } catch (error) { message(error) }
    }
  },
  async refresh() {
    try {
      const project = await api('adminGetProject', { id: this.projectId })
      this.setData({ project: { ...project, externalDeliveries: project.externalDeliveries || [] }, showBankConfirm: project.quoteStatus === 'accepted' && project.paymentStatus === 'unpaid', draft: project.reportDraft || this.data.draft })
    } catch (error) { message(error) }
  },
  deep() { wx.navigateTo({ url: `/pages/admin-deep/admin-deep?id=${this.projectId}` }) },
  input(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
  formInput(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  draftInput(e) { this.setData({ [`draft.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  pickType(e) { this.setData({ typeIndex: Number(e.detail.value) }) },
  async create() {
    if (this.data.busy) return
    const yuan = Number(this.data.form.quoteYuan)
    if (!Number.isFinite(yuan) || yuan <= 0 || Math.round(yuan * 100) !== yuan * 100) return wx.showToast({ title: '请填写正确的含税报价', icon: 'none' })
    this.setData({ busy: true })
    try {
      const f = this.data.form
      const created = await api('adminCreateProject', { applicationId: this.applicationId, buyerName: f.buyerName, buyerTaxId: f.buyerTaxId, type: TYPES[this.data.typeIndex].value, title: f.title, scope: f.scope, deliverables: f.deliverables, quoteCents: Math.round(yuan * 100) })
      wx.redirectTo({ url: `/pages/admin-project/admin-project?id=${created.id}` })
    } catch (error) { message(error) } finally { this.setData({ busy: false }) }
  },
  async sendQuote() { await this.update({ quoteStatus: 'sent' }) },
  async acceptQuote() { await this.update({ quoteStatus: 'accepted', acceptanceReference: this.data.acceptanceReference }) },
  async update(fields) {
    try { await api('adminUpdateProject', { id: this.projectId, ...fields }); wx.showToast({ title: '已更新', icon: 'success' }); await this.refresh() }
    catch (error) { message(error) }
  },
  async confirmTransfer() {
    wx.showModal({ title: '确认实际到账', content: '请先在银行账户中核对到账金额和流水，付款截图不能作为到账依据。', success: async res => {
      if (!res.confirm) return
      try { await api('adminConfirmTransfer', { id: this.projectId, bankReference: this.data.bankReference }); wx.showToast({ title: '已确认到账', icon: 'success' }); await this.refresh() } catch (error) { message(error) }
    } })
  },
  async invite() {
    try {
      const x = await api('adminCreateInvite', { projectId: this.projectId, recipientName: this.data.inviteName, recipientPhone: this.data.invitePhone, authorizationReference: this.data.inviteAuthorization })
      this.setData({ inviteCode: x.code })
      wx.showModal({ title: '邀请码已生成', content: '仅向经购买方确认的接收人发送。邀请码只显示这一次，24 小时后失效。', showCancel: false })
    } catch (error) { message(error) }
  },
  copyInvite() { if (this.data.inviteCode) wx.setClipboardData({ data: this.data.inviteCode }) },
  revokeRecipient(e) {
    const recipientOpenid = e.currentTarget.dataset.openid
    wx.showModal({ title: '撤销报告权限', content: '请先核对购买方撤销授权的依据。撤销后该微信身份不能再打开当前报告。', success: async res => {
      if (!res.confirm) return
      try { await api('adminRevokeRecipient', { id: this.projectId, recipientOpenid, authorizationReference: this.data.revokeAuthorization }); await this.refresh() } catch (error) { message(error) }
    } })
  },
  async saveDraft() {
    try { await api('adminSaveDraft', { id: this.projectId, draft: this.data.draft }); wx.showToast({ title: '工作稿已保存', icon: 'success' }); await this.refresh() } catch (error) { message(error) }
  },
  async preview() {
    try {
      const x = await api('adminPreviewReport', { id: this.projectId })
      await this.openPdf(x.url)
      await this.refresh()
    } catch (error) { message(error) }
  },
  async openPdf(url, showMenu = false) {
    const x = await new Promise((resolve, reject) => wx.downloadFile({ url, success: resolve, fail: reject }))
    if (x.statusCode !== 200) throw new Error('PDF 预览下载失败')
    await new Promise((resolve, reject) => wx.openDocument({ filePath: x.tempFilePath, fileType: 'pdf', showMenu, success: resolve, fail: reject }))
  },
  async openApproved() {
    try { const x = await api('adminGetPublishedReportUrl', { id: this.projectId }); await this.openPdf(x.url, true) }
    catch (error) { message(error) }
  },
  chooseChannel(e) { this.setData({ deliveryChannel: e.detail.value ? 'wecom' : 'wechat' }) },
  async recordDelivery() {
    try {
      await api('adminRecordExternalDelivery', { id: this.projectId, channel: this.data.deliveryChannel, recipientName: this.data.deliveryName, authorizationReference: this.data.deliveryAuthorization })
      wx.showToast({ title: '外发记录已保存', icon: 'success' }); await this.refresh()
    } catch (error) { message(error) }
  },
  publish() {
    wx.showModal({ title: '发布最终报告', content: '请确认已经查看 PDF 预览，核对内容与接收人授权。发布后指定接收人将可查看。', success: async res => {
      if (!res.confirm) return
      try { await api('adminPublishReport', { id: this.projectId }); wx.showToast({ title: '报告已发布', icon: 'success' }); await this.refresh() } catch (error) { message(error) }
    } })
  }
})
