const { api, message } = require('../../utils/api')
Page({
  data: { settings: {} },
  async onLoad() { try { const x = await api('bootstrap'); this.setData({ settings: x.settings }) } catch (error) { message(error) } }
})
