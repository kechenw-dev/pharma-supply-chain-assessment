const { api, message } = require('../../utils/api')
const STATES = [
  { value: 'pending', label: '待联系' }, { value: 'contacting', label: '沟通中' },
  { value: 'contacted', label: '已联系' }, { value: 'not_reached', label: '未接通' },
  { value: 'qualified', label: '适合正式诊断' }, { value: 'quoted', label: '已报价' },
  { value: 'declined', label: '暂不合作' }, { value: 'do_not_contact', label: '不愿再联系' }
]
Page({
  data: { lead: null, states: STATES, statusIndex: 0, note: '', busy: false },
  async onLoad(options) {
    this.id = options.id
    try {
      const lead = await api('adminGetLead', { id: this.id })
      this.setData({ lead, statusIndex: Math.max(0, STATES.findIndex(x => x.value === lead.followUpStatus)) })
    } catch (error) { message(error) }
  },
  pick(e) { this.setData({ statusIndex: Number(e.detail.value) }) },
  input(e) { this.setData({ note: e.detail.value }) },
  call() { if (this.data.lead) wx.makePhoneCall({ phoneNumber: this.data.lead.phone }) },
  async save() {
    if (this.data.busy) return
    this.setData({ busy: true })
    try { await api('adminUpdateLead', { id: this.id, status: STATES[this.data.statusIndex].value, note: this.data.note }); wx.showToast({ title: '已保存', icon: 'success' }); wx.navigateBack() }
    catch (error) { message(error) } finally { this.setData({ busy: false }) }
  }
})
