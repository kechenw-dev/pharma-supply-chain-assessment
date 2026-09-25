const { api, message } = require('../../utils/api')

const SCENES = [
  { id: 'communication', number: '01', title: '信息变了，团队没同步', detail: '需求、规格和交期变更如何传到内部与供应商', icon: '↗' },
  { id: 'planning', number: '02', title: '关键物料总在催', detail: '计划、分级和供应商交付能否真正衔接', icon: '↘' },
  { id: 'inventory', number: '03', title: '库存不少，仍然缺料', detail: '库存结构、周转和资金压力是否看得清', icon: '◎' },
  { id: 'quality', number: '04', title: '变更与放行有风险', detail: '质量评估、批准和隔离机制是否可靠', icon: '◇' }
]

Page({
  data: { isAdmin: false, scenes: SCENES, hasDraft: false, draftProgress: '' },
  async onShow() {
    const draft = wx.getStorageSync('assessmentDraft')
    const answered = draft && draft.answers ? Object.keys(draft.answers).length : 0
    this.setData({ hasDraft: Boolean(draft && draft.businessType && answered), draftProgress: `已回答 ${answered} / 15 项` })
    try {
      const session = await api('bootstrap')
      this.setData({ isAdmin: session.isAdmin })
    } catch (error) { message(error) }
  },
  start() { wx.navigateTo({ url: '/pages/profile/profile' }) },
  startScene(e) { wx.navigateTo({ url: `/pages/profile/profile?focus=${e.currentTarget.dataset.focus}` }) },
  resume() {
    const draft = wx.getStorageSync('assessmentDraft')
    const answered = draft && draft.answers ? Object.keys(draft.answers) : []
    wx.navigateTo({ url: answered.filter(id => /^Q\d+$/.test(id)).length === 14 && answered.includes('R1') ? '/pages/lead/lead' : '/pages/quiz/quiz' })
  },
  reports() { wx.navigateTo({ url: '/pages/reports/reports' }) },
  consult() { wx.navigateTo({ url: '/pages/consult/consult' }) },
  admin() { wx.navigateTo({ url: '/pages/admin/admin' }) },
  onShareAppMessage() { return { title: '5 分钟了解医药供应链运作中的风险线索', path: '/pages/index/index' } },
  onShareTimeline() { return { title: '医药供应链健康评估｜5 分钟免费自评' } }
})
