# 部署与验收

## 1. 账号与环境

1. 用上海恒越禾生物医药有限公司的小程序管理员账号登录微信公众平台及微信开发者工具，核对 AppID 为 `wxafbb48bf5de464ed`。
2. 在开发者工具检查“云开发”环境。若未开通，以该小程序主体创建一个环境；记录环境 ID。若已有环境，确认是否有既存业务数据，避免在错误环境中创建集合。
3. 将 `miniprogram/config.js` 中的占位环境 ID 改为真实环境 ID。AppSecret、微信支付商户密钥、GitHub 凭据不得进入源码。
4. 在工程根目录运行 `node scripts/fetch-font.js`，脚本从 Noto 官方仓库下载中文字体并核验 SHA-256。为 `assessmentApi` 云函数设置 Node.js 20 或平台支持的兼容运行时，并部署目录 `cloudfunctions/assessmentApi`，包含依赖和 `fonts`。若平台不支持当前 Node.js 版本，须在开发环境验证后调整。

## 2. 数据权限

创建集合：`assessment_leads`、`diagnosis_applications`、`diagnosis_projects`、`report_invites`、`assessment_settings`、`assessment_audit`。每个集合的客户端安全规则设为：

```json
{"read":false,"write":false}
```

云函数按微信 OpenID 校验每个业务操作。云函数调用规则可设为：

```json
{"*":{"invoke":false},"assessmentApi":{"invoke":"auth.loginType != 'ANONYMOUS' && auth != null"}}
```

云存储中 `assessment-report-previews/` 和 `assessment-reports/` 都设为仅后台可读写，不能公有读。批准时会另外生成含批准日期的正式 PDF。上线前用非授权微信账号验证：不能直接读取数据库集合，也不能通过未授权的文件 ID 获取 PDF。

云开发规则具体格式以当前环境控制台为准；不能只依赖客户端隐藏按钮。官方说明：[数据库安全规则](https://docs.cloudbase.net/rule/rule-example)、[云函数调用规则](https://docs.cloudbase.net/cloud-function/security-rules)、[存储权限](https://docs.cloudbase.net/storage/data-permission)。

## 3. 管理员与联系信息

1. 在开发环境用实际管理员微信进入小程序。可在开发者工具控制台运行 `wx.cloud.callFunction({name:'assessmentApi',data:{action:'bootstrap'}}).then(console.log)`，从 `result.data.openid` 取得该微信身份的 OpenID；仅在受控后台记录，不放入仓库。云函数环境变量 `ADMIN_OPENIDS` 填入逗号分隔的管理员 OpenID，然后重新部署云函数。
2. 管理员页面填对外微信号、电话、运营主体、信息保存期限与删除规则，并核对小程序平台的隐私保护指引。填好后再打开“允许收集信息”。缺少联系电话或保存规则时，云函数拒绝提交个人信息。
3. 设置域名／文件下载白名单（若当前运行方式要求），在真机确认 `wx.downloadFile` 和 `wx.openDocument` 可以预览已授权 PDF。

## 4. 业务验收

用测试数据和至少两个不同微信身份验证：

- 受测者可完成自评并登记，能看到本人七维结果；另一身份不能查看其答卷。
- 管理员能查看线索、登记回访、创建项目。没有管理员 OpenID 的身份不能调用 `admin*` 动作。
- 报价被记录为客户确认后，管理员依据银行实际流水手动确认到账；不能只凭付款截图。
- 收款前不能保存 16 项深入访谈；收款后可保存问答及资料来源，D7／D9 有数据时须附期间和币种。访谈记录不会自动成为客户报告。
- 未收款不能保存并发布正式报告；有工作稿后先生成 PDF 预览，人工核对后才批准。
- 未绑定指定接收人的身份不能查看 PDF；邀请码须同时匹配指定手机号。旧版本在新工作稿审核期间仍可查看；新版本批准后替换当前版本。
- 管理员打开正式 PDF 后，可按约定人工通过微信或企业微信发送。实际发送完成后记录接收人、授权依据、渠道和版本；该记录不代表系统自动发送。
- 检查联系信息、报告、审计日志和云存储权限。清除测试联系人及 PDF，并按真实业务设置保留与删除流程。
- 在开发版和体验版测试完，再提交微信小程序平台审核。审核通过后发布；朋友圈分享使用首页入口。

## 5. 尚需平台条件

- **微信支付**：商户号尚未开通。取得商户号、AppID 绑定、API v3 证书／密钥后，再实现和联调支付下单、回调验签与后端查单；当前项目只支持人工核实对公转账，不能在小程序内付款。
- **发票**：由签约与收款主体按实际财务流程人工开具。此仓库不含税号、开户地址或银行账号。
- **消息提醒**：订阅消息需要平台模板和接收人主动授权。当前由顾问人工通知，不自动把 PDF 推送到微信会话。
