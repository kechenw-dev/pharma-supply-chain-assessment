const { BUSINESS_TYPES, ROLES } = require('../../data/questions')

Page({
  data: { businesses: BUSINESS_TYPES, roles: ROLES, businessIndex: -1, roleIndex: -1 },
  pickBusiness(e) { this.setData({ businessIndex: Number(e.detail.value) }) },
  pickRole(e) { this.setData({ roleIndex: Number(e.detail.value) }) },
  next() {
    const { businesses, roles, businessIndex, roleIndex } = this.data
    if (businessIndex < 0 || roleIndex < 0) return wx.showToast({ title: '请选择企业类型和岗位', icon: 'none' })
    wx.setStorageSync('assessmentDraft', { businessType: businesses[businessIndex].value, role: roles[roleIndex].value, answers: {} })
    wx.navigateTo({ url: '/pages/quiz/quiz' })
  }
})
