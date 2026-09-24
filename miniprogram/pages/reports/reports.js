const { api, message } = require('../../utils/api')

Page({
  data: { reports: [], code: '', phone: '', busy: false },
  onShow() { this.load() },
  async load() {
    try { this.setData({ reports: await api('myProjects') }) } catch (error) { message(error) }
  },
  input(e) { this.setData({ code: e.detail.value }) },
  inputPhone(e) { this.setData({ phone: e.detail.value }) },
  async redeem() {
    if (this.data.busy || !this.data.code) return
    this.setData({ busy: true })
    try {
      await api('redeemInvite', { code: this.data.code, phone: this.data.phone })
      this.setData({ code: '', phone: '' })
      wx.showToast({ title: '已绑定报告接收权限', icon: 'success' })
      await this.load()
    } catch (error) { message(error) } finally { this.setData({ busy: false }) }
  },
  async open(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '正在打开报告' })
    try {
      const report = await api('getReportUrl', { id })
      const downloaded = await new Promise((resolve, reject) => wx.downloadFile({ url: report.url, success: resolve, fail: reject }))
      if (downloaded.statusCode !== 200) throw new Error('报告下载失败')
      wx.openDocument({ filePath: downloaded.tempFilePath, fileType: 'pdf', showMenu: false, fail: message })
    } catch (error) { message(error) } finally { wx.hideLoading() }
  }
})
