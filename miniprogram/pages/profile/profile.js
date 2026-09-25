const { BUSINESS_TYPES, ROLES, DIMENSIONS } = require('../../data/questions')

Page({
  data: { businesses: BUSINESS_TYPES, roles: ROLES, businessIndex: -1, roleIndex: -1, focus: '', focusLabel: '' },
  onLoad(options) {
    const dimension = DIMENSIONS.find(d => d.id === options.focus)
    if (dimension) this.setData({ focus: dimension.id, focusLabel: dimension.title })
  },
  pickBusiness(e) { this.setData({ businessIndex: Number(e.currentTarget.dataset.index) }) },
  pickRole(e) { this.setData({ roleIndex: Number(e.currentTarget.dataset.index) }) },
  next() {
    const { businesses, roles, businessIndex, roleIndex } = this.data
    if (businessIndex < 0 || roleIndex < 0) return wx.showToast({ title: '请选择企业类型和岗位', icon: 'none' })
    wx.setStorageSync('assessmentDraft', { businessType: businesses[businessIndex].value, role: roles[roleIndex].value, focus: this.data.focus, answers: {}, currentIndex: 0 })
    wx.navigateTo({ url: '/pages/quiz/quiz' })
  }
})
