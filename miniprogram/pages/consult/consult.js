const { api, message } = require('../../utils/api')
Page({
  data: { wechat: '', phone: '' },
  async onLoad() { try { const x = await api('bootstrap'); this.setData({ wechat: x.settings.contactWechat, phone: x.settings.contactPhone }) } catch (error) { message(error) } },
  copy() { if (this.data.wechat) wx.setClipboardData({ data: this.data.wechat }) },
  call() { if (this.data.phone) wx.makePhoneCall({ phoneNumber: this.data.phone }) }
})
