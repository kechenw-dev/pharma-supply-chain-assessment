const config = require('./config')

App({
  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({ title: '版本提示', content: '当前微信版本暂不支持云开发，请升级微信。', showCancel: false })
      return
    }
    wx.cloud.init({ env: config.envId, traceUser: true })
  },
  globalData: { config }
})
