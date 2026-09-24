const BUSINESS_TYPES = new Set(['drug', 'api', 'mah_cdmo', 'trade'])
const ROLES = new Set(['leader', 'supply', 'production', 'sales', 'other'])
const DIAGNOSIS_TYPES = new Set(['remote', 'onsite', 'unsure'])
const FOLLOW_UP_STATES = new Set(['pending', 'contacting', 'contacted', 'not_reached', 'qualified', 'quoted', 'declined', 'do_not_contact'])

function requiredText(value, name, max = 120) {
  const s = typeof value === 'string' ? value.trim() : ''
  if (!s || s.length > max) throw new Error(`${name}不能为空，且不得超过${max}字`)
  return s
}

function optionalText(value, max = 500) {
  if (value == null || value === '') return ''
  if (typeof value !== 'string' || value.trim().length > max) throw new Error('输入内容过长')
  return value.trim()
}

function mobile(value) {
  const s = requiredText(value, '手机号', 20)
  if (!/^1[3-9]\d{9}$/.test(s)) throw new Error('请输入有效的中国大陆手机号')
  return s
}

function choice(value, options, name) {
  if (!options.has(value)) throw new Error(`${name}无效`)
  return value
}

function positiveCents(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 100000000000) throw new Error('报价金额无效')
  return value
}

module.exports = { BUSINESS_TYPES, ROLES, DIAGNOSIS_TYPES, FOLLOW_UP_STATES, requiredText, optionalText, mobile, choice, positiveCents }
