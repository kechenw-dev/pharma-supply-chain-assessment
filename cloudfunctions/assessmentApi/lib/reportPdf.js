const path = require('node:path')
const PDFDocument = require('pdfkit')

const FONT = path.join(__dirname, '..', 'fonts', 'NotoSansCJKsc-Regular.otf')

function renderReportPdf(project) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 52, info: { Title: project.title || '医药供应链诊断报告', Author: '上海恒越禾生物医药有限公司' } })
    const chunks = []
    doc.on('data', x => chunks.push(x))
    doc.on('error', reject)
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    doc.font(FONT)
    doc.fillColor('#123B58').fontSize(22).text('医药供应链诊断报告', { align: 'center' })
    doc.moveDown(0.6)
    doc.fontSize(13).text(project.title || '', { align: 'center' })
    doc.moveDown(1.2)
    doc.fillColor('#334E68').fontSize(10)
    doc.text(`购买方：${project.buyerName || ''}`)
    doc.text(`诊断方式：${project.type === 'onsite' ? '现场全链路诊断' : '远程单一问题诊断'}`)
    doc.text(`报告版本：v${project.version || 1}`)
    doc.text(`PDF 生成日期：${(project.generatedAt || '').slice(0, 10)}`)
    if (project.approvedAt) doc.text(`人工批准日期：${project.approvedAt.slice(0, 10)}`)
    else doc.fillColor('#A1422B').text('内部预览稿，未经人工批准，不得向客户交付').fillColor('#334E68')
    doc.moveDown(0.7)
    doc.fillColor('#788999').fontSize(9).text('仅供购买方指定接收人使用。结论基于约定范围和已取得的资料；未核实事项在报告中单独标明。')
    doc.moveDown(1.3)

    section(doc, '一、诊断范围与交付物', `${project.scope || ''}\n\n交付物：${project.deliverables || ''}`)
    section(doc, '二、结论摘要', project.reportDraft.summary)
    section(doc, '三、证据与来源', project.reportDraft.evidence)
    section(doc, '四、风险及待核实事项', project.reportDraft.risks)
    section(doc, '五、建议行动', project.reportDraft.actions)
    if (project.reportDraft.inventoryNote) section(doc, '六、库存结构与周转', project.reportDraft.inventoryNote)
    if (project.reportDraft.limits) section(doc, '服务边界与限制', project.reportDraft.limits)

    doc.end()
  })
}

function section(doc, heading, body) {
  doc.moveDown(0.9)
  doc.fillColor('#0F766E').fontSize(13).text(heading, { continued: false })
  doc.moveDown(0.4)
  doc.fillColor('#233B50').fontSize(10.5).text(body || '无', { lineGap: 5, paragraphGap: 7 })
}

module.exports = { renderReportPdf }
