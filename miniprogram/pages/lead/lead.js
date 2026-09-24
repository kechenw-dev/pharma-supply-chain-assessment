const { api, message } = require('../../utils/api')

Page({
  data: { form: { companyName: '', contactName: '', jobTitle: '', phone: '', wechat: '' }, accepted: [], settings: {}, busy: false },
  async onLoad() {
    const draft = wx.getStorageSync('assessmentDraft')
    if (!draft || !draft.answers || Object.keys(draft.answers).length < 14) return wx.redirectTo({ url: '/pages/profile/profile' })
    try { const session = await api('bootstrap'); this.setData({ settings: session.settings }) } catch (error) { message(error) }
  },
  input(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  check(e) { this.setData({ accepted: e.detail.value }) },
  privacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }) },
  async submit() {
    if (this.data.busy) return
    if (!this.data.settings.privacyPublished) return wx.showToast({ title: '信息使用说明尚未发布', icon: 'none' })
    const accepted = this.data.accepted
    if (!accepted.includes('notice') || !accepted.includes('callback')) return wx.showToast({ title: '请阅读并确认说明', icon: 'none' })
    const draft = wx.getStorageSync('assessmentDraft')
    this.setData({ busy: true })
    try {
      const data = await api('submitAssessment', { ...draft, ...this.data.form, noticeAccepted: true, callbackAcknowledged: true, marketingOptIn: accepted.includes('marketing') })
      wx.removeStorageSync('assessmentDraft')
      wx.redirectTo({ url: `/pages/result/result?id=${data.id}` })
    } catch (error) { message(error) } finally { this.setData({ busy: false }) }
  }
})
