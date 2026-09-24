const { api, message } = require('../../utils/api')

Page({
  data: { isAdmin: false },
  async onShow() {
    try {
      const session = await api('bootstrap')
      this.setData({ isAdmin: session.isAdmin })
    } catch (error) { message(error) }
  },
  start() { wx.navigateTo({ url: '/pages/profile/profile' }) },
  reports() { wx.navigateTo({ url: '/pages/reports/reports' }) },
  consult() { wx.navigateTo({ url: '/pages/consult/consult' }) },
  admin() { wx.navigateTo({ url: '/pages/admin/admin' }) },
  onShareAppMessage() { return { title: '5 分钟了解医药供应链运作中的风险线索', path: '/pages/index/index' } },
  onShareTimeline() { return { title: '医药供应链健康评估｜5 分钟免费自评' } }
})
