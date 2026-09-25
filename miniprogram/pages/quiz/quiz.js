const { adaptedQuestions, prioritizeQuestions, OPTIONS, DIMENSIONS } = require('../../data/questions')

const GUIDES = {
  communication: '想一想最近一次客户需求或交期变化：谁确认了新版本，谁负责通知，最后在哪里查到处理结果？',
  planning: '以一项关键物料为例，看看需求变化后，计划、采购和生产是否按同一节奏更新。',
  supplier: '回想一位关键供应商：需求是否说清楚，交期是否确认，供不上时备用来源是否可用。',
  inventory: '看最近一次缺料或积压：原料、在制品与成品的数据能否放在一起解释。',
  delivery: '从一个批次或一张订单出发，检查状态、库位、发运和异常处理能否串起来。',
  data: '比较采购、仓库和管理报表里同一种物料的信息，看看编码、数量和状态是否一致。',
  quality: '回想最近一次供应来源变更或待验品处理，看看评估、批准与隔离记录是否可查。',
  role: '最后从你的岗位视角，补充一个最贴近日常工作的判断。'
}

Page({
  data: { questions: [], options: OPTIONS, index: 0, current: null, selected: '', progress: '', progressPercent: 0, dimension: '', guide: '' },
  onLoad() {
    const draft = wx.getStorageSync('assessmentDraft')
    if (!draft || !draft.businessType) return wx.redirectTo({ url: '/pages/profile/profile' })
    const questions = prioritizeQuestions(adaptedQuestions(draft.businessType, draft.role), draft.focus)
    this.setData({ questions })
    const resumeIndex = Math.min(Math.max(Number(draft.currentIndex) || 0, 0), questions.length - 1)
    this.showQuestion(resumeIndex)
  },
  showQuestion(index) {
    const draft = wx.getStorageSync('assessmentDraft') || { answers: {} }
    const q = this.data.questions[index]
    const dim = DIMENSIONS.find(x => x.id === q.dimension)
    this.setData({ index, current: q, selected: draft.answers[q.id] || '', progress: `${index + 1} / ${this.data.questions.length}`, progressPercent: Math.round((index + 1) / this.data.questions.length * 100), dimension: dim ? dim.title : '与你的岗位相关', guide: GUIDES[q.dimension] || '' })
  },
  choose(e) {
    const selected = e.currentTarget.dataset.value
    this.setData({ selected })
    const draft = wx.getStorageSync('assessmentDraft')
    if (draft && draft.answers && this.data.current) {
      draft.answers[this.data.current.id] = selected
      wx.setStorageSync('assessmentDraft', draft)
    }
  },
  previous() { if (this.data.index > 0) this.showQuestion(this.data.index - 1) },
  next() {
    if (!this.data.selected) return wx.showToast({ title: '请选择一个答案', icon: 'none' })
    const draft = wx.getStorageSync('assessmentDraft')
    draft.answers[this.data.current.id] = this.data.selected
    draft.currentIndex = this.data.index + 1
    wx.setStorageSync('assessmentDraft', draft)
    if (this.data.index + 1 < this.data.questions.length) this.showQuestion(this.data.index + 1)
    else wx.navigateTo({ url: '/pages/lead/lead' })
  }
})
