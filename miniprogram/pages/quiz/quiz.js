const { adaptedQuestions, OPTIONS, DIMENSIONS } = require('../../data/questions')

Page({
  data: { questions: [], options: OPTIONS, index: 0, current: null, selected: '', progress: '', dimension: '' },
  onLoad() {
    const draft = wx.getStorageSync('assessmentDraft')
    if (!draft || !draft.businessType) return wx.redirectTo({ url: '/pages/profile/profile' })
    const questions = adaptedQuestions(draft.businessType, draft.role)
    this.setData({ questions })
    this.showQuestion(0)
  },
  showQuestion(index) {
    const draft = wx.getStorageSync('assessmentDraft') || { answers: {} }
    const q = this.data.questions[index]
    const dim = DIMENSIONS.find(x => x.id === q.dimension)
    this.setData({ index, current: q, selected: draft.answers[q.id] || '', progress: `${index + 1} / ${this.data.questions.length}`, dimension: dim ? dim.title : '与你的岗位相关' })
  },
  choose(e) { this.setData({ selected: e.currentTarget.dataset.value }) },
  previous() { if (this.data.index > 0) this.showQuestion(this.data.index - 1) },
  next() {
    if (!this.data.selected) return wx.showToast({ title: '请选择一个答案', icon: 'none' })
    const draft = wx.getStorageSync('assessmentDraft')
    draft.answers[this.data.current.id] = this.data.selected
    wx.setStorageSync('assessmentDraft', draft)
    if (this.data.index + 1 < this.data.questions.length) this.showQuestion(this.data.index + 1)
    else wx.navigateTo({ url: '/pages/lead/lead' })
  }
})
