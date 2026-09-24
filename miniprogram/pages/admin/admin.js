const { api, message } = require('../../utils/api')

Page({
  data: { allowed: false, tab: 'leads', leads: [], applications: [], projects: [], settings: {}, busy: false },
  async onShow() {
    try {
      const session = await api('bootstrap')
      if (!session.isAdmin) return wx.showModal({ title: '无权限', content: '当前微信身份未被配置为管理员。', showCancel: false, success: () => wx.navigateBack() })
      this.setData({ allowed: true, settings: session.settings })
      await this.refresh()
    } catch (error) { message(error) }
  },
  async refresh() {
    try {
      const [leads, applications, projects] = await Promise.all([api('adminListLeads'), api('adminListApplications'), api('adminListProjects')])
      this.setData({ leads, applications, projects })
    } catch (error) { message(error) }
  },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }) },
  lead(e) { wx.navigateTo({ url: `/pages/admin-lead/admin-lead?id=${e.currentTarget.dataset.id}` }) },
  application(e) { wx.navigateTo({ url: `/pages/admin-project/admin-project?applicationId=${e.currentTarget.dataset.id}` }) },
  project(e) { wx.navigateTo({ url: `/pages/admin-project/admin-project?id=${e.currentTarget.dataset.id}` }) },
  settingInput(e) { this.setData({ [`settings.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  privacySwitch(e) { this.setData({ 'settings.privacyPublished': e.detail.value }) },
  async saveSettings() {
    if (this.data.busy) return
    this.setData({ busy: true })
    try {
      const settings = await api('adminSettings', this.data.settings)
      this.setData({ settings })
      wx.showToast({ title: '配置已保存', icon: 'success' })
    } catch (error) { message(error) } finally { this.setData({ busy: false }) }
  }
})
