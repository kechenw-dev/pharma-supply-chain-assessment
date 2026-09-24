const { api, message } = require('../../utils/api')
const TYPES = [
  { value: 'remote', label: '远程单一问题专题诊断' },
  { value: 'onsite', label: '现场全链路诊断' },
  { value: 'unsure', label: '暂不确定，请顾问建议' }
]

Page({
  data: { types: TYPES, typeIndex: 2, form: { issue: '', scope: '', preferredContactTime: '' }, busy: false },
  onLoad(options) { this.leadId = options.leadId },
  pickType(e) { this.setData({ typeIndex: Number(e.detail.value) }) },
  input(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  async submit() {
    if (this.data.busy) return
    if (!this.leadId) return wx.showToast({ title: '请先完成免费体检', icon: 'none' })
    this.setData({ busy: true })
    try {
      await api('submitApplication', { leadId: this.leadId, type: TYPES[this.data.typeIndex].value, ...this.data.form })
      wx.showModal({ title: '申请已提交', content: '顾问会联系你确认诊断范围和报价。提交申请不代表已付款或已签约。', showCancel: false, success: () => wx.reLaunch({ url: '/pages/index/index' }) })
    } catch (error) { message(error) } finally { this.setData({ busy: false }) }
  }
})
