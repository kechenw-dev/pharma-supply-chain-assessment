const { api, message } = require('../../utils/api')
const DEEP = require('../../data/deepQuestions')

Page({
  data: { title: '', questions: [], responses: {}, paid: false, busy: false },
  async onLoad(options) {
    this.projectId = options.id
    try {
      const project = await api('adminGetProject', { id: this.projectId })
      const responses = {}
      for (const q of DEEP) responses[q.id] = { answer: '', source: '', period: '', currency: '', ...(project.deepResponses && project.deepResponses[q.id] || {}) }
      this.setData({ title: project.title, paid: project.paymentStatus === 'paid', responses,
        questions: DEEP.map(q => ({ id: q.id, title: project.businessType === 'trade' && q.trade ? q.trade : q.title })) })
    } catch (error) { message(error) }
  },
  input(e) {
    const { id, field } = e.currentTarget.dataset
    this.setData({ [`responses.${id}.${field}`]: e.detail.value })
  },
  async save() {
    if (this.data.busy || !this.data.paid) return
    this.setData({ busy: true })
    try {
      await api('adminSaveDeepAssessment', { id: this.projectId, responses: this.data.responses })
      wx.showToast({ title: '访谈记录已保存', icon: 'success' })
    } catch (error) { message(error) } finally { this.setData({ busy: false }) }
  }
})
