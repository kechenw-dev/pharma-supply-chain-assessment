const { api, message } = require('../../utils/api')
const LABELS = { stable: '持续执行且有记录', uneven: '执行或记录不稳定', personal: '主要依赖个人', missing: '缺少固定做法', unknown: '待核实' }

Page({
  data: { assessment: null, dimensions: [], findings: [], alerts: [], countMain: '', countSub: '', insufficient: false, expandedDimension: '' },
  async onLoad(options) {
    this.id = options.id
    try {
      const assessment = await api('getAssessment', { id: this.id })
      const result = assessment.result
      this.setData({
        assessment: { ...assessment, date: (assessment.createdAt || '').slice(0, 10) },
        dimensions: result.dimensions.map((d, index) => ({ ...d, number: String(index + 1).padStart(2, '0'), stateLabel: LABELS[d.state] || '待核实', stateClass: 'state-' + (d.state || 'unknown') })),
        findings: result.findings.map(f => ({ ...f, stateLabel: LABELS[f.state] })),
        alerts: result.alerts,
        insufficient: result.informationInsufficient,
        countMain: result.count ? `${result.count.implemented} / ${result.count.substantive}` : '待补充',
        countSub: result.count ? '已落实机制 / 已作实质回答' : '信息不足，暂不展示整体计数',
        expandedDimension: (result.dimensions.find(d => d.hook) || result.dimensions[0] || {}).id || '',
        unknownCount: result.unknownCount
      })
    } catch (error) { message(error) }
  },
  toggleDimension(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedDimension: this.data.expandedDimension === id ? '' : id })
  },
  consult() { wx.navigateTo({ url: '/pages/consult/consult' }) },
  diagnosis() { wx.navigateTo({ url: `/pages/diagnosis/diagnosis?leadId=${this.id}` }) },
  home() { wx.reLaunch({ url: '/pages/index/index' }) },
  onShareAppMessage() { return { title: '医药供应链健康评估｜免费自评', path: '/pages/index/index' } }
})
