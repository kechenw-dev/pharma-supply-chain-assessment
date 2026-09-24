const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const URL = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf'
const SHA256 = '2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b'
const target = path.join(__dirname, '..', 'cloudfunctions', 'assessmentApi', 'fonts', 'NotoSansCJKsc-Regular.otf')

function digest(data) { return crypto.createHash('sha256').update(data).digest('hex') }

async function main() {
  if (fs.existsSync(target) && digest(fs.readFileSync(target)) === SHA256) {
    console.log('Noto Sans CJK SC font already verified')
    return
  }
  const response = await fetch(URL)
  if (!response.ok) throw new Error(`Font download failed: HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 20 * 1024 * 1024 || digest(bytes) !== SHA256) throw new Error('Font checksum mismatch')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, bytes)
  console.log('Noto Sans CJK SC font downloaded and verified')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
