const { BUSINESS_TYPES, ROLES } = require('../../data/questions')

Page({
  data: { businesses: BUSINESS_TYPES, roles: ROLES, businessIndex: -1, roleIndex: -1, businessLabel: '请选择', roleLabel: '请选择' },
  pickBusiness(e) { const businessIndex = Number(e.detail.value); this.setData({ businessIndex, businessLabel: BUSINESS_TYPES[businessIndex].label }) },
  pickRole(e) { const roleIndex = Number(e.detail.value); this.setData({ roleIndex, roleLabel: ROLES[roleIndex].label }) },
  next() {
    const { businesses, roles, businessIndex, roleIndex } = this.data
    if (businessIndex < 0 || roleIndex < 0) return wx.showToast({ title: '请选择企业类型和岗位', icon: 'none' })
    wx.setStorageSync('assessmentDraft', { businessType: businesses[businessIndex].value, role: roles[roleIndex].value, answers: {} })
    wx.navigateTo({ url: '/pages/quiz/quiz' })
  }
})
