const test = require('node:test')
const assert = require('node:assert/strict')
const { renderReportPdf } = require('../cloudfunctions/assessmentApi/lib/reportPdf')

test('经人工批准的中文报告能生成 PDF', async () => {
  const pdf = await renderReportPdf({
    title: '计划与库存专题诊断', buyerName: '示例企业', type: 'remote', version: 1,
    generatedAt: '2026-09-24T00:00:00.000Z', approvedAt: '2026-09-24T00:00:00.000Z', scope: '只覆盖一个业务单元。', deliverables: '诊断结论与行动建议。',
    reportDraft: { summary: '库存数据存在口径差异。', evidence: '来源：客户访谈及自报资料。', risks: '部分数据待财务确认。', actions: '先统一库存分类与统计期间。', inventoryNote: '不计算行业排名。', limits: '不构成 GMP 合规认证。' }
  })
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  assert.ok(pdf.length > 1000)
})
