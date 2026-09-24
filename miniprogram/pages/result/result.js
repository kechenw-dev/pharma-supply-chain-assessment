const { api, message } = require('../../utils/api')
const LABELS = { stable: '持续执行且有记录', uneven: '执行或记录不稳定', personal: '主要依赖个人', missing: '缺少固定做法', unknown: '待核实' }

Page({
  data: { assessment: null, dimensions: [], findings: [], alerts: [], countText: '', insufficient: false },
  async onLoad(options) {
    this.id = options.id
    try {
      const assessment = await api('getAssessment', { id: this.id })
      const result = assessment.result
      this.setData({
        assessment: { ...assessment, date: (assessment.createdAt || '').slice(0, 10) },
        dimensions: result.dimensions.map(d => ({ ...d, stateLabel: LABELS[d.state] || '待核实' })),
        findings: result.findings.map(f => ({ ...f, stateLabel: LABELS[f.state] })),
        alerts: result.alerts,
        insufficient: result.informationInsufficient,
        countText: result.count ? `已落实机制 ${result.count.implemented} / 已作实质回答 ${result.count.substantive}` : '',
        unknownCount: result.unknownCount
      })
    } catch (error) { message(error) }
  },
  consult() { wx.navigateTo({ url: '/pages/consult/consult' }) },
  diagnosis() { wx.navigateTo({ url: `/pages/diagnosis/diagnosis?leadId=${this.id}` }) },
  home() { wx.reLaunch({ url: '/pages/index/index' }) },
  onShareAppMessage() { return { title: '医药供应链健康评估｜免费自评', path: '/pages/index/index' } }
})
