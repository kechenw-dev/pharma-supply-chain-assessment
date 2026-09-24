const config = require('../config')

async function api(action, data = {}) {
  const res = await wx.cloud.callFunction({ name: config.apiFunction, data: { action, data } })
  const body = res.result || {}
  if (!body.ok) throw new Error(body.error || '操作失败，请稍后重试')
  return body.data
}

function message(error) {
  wx.showToast({ title: error && error.message || '操作失败', icon: 'none', duration: 2800 })
}

module.exports = { api, message }
