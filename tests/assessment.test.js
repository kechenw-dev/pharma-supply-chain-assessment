const test = require('node:test')
const assert = require('node:assert/strict')
const { summarize, validateAnswers } = require('../cloudfunctions/assessmentApi/lib/assessment')

const all = state => Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`Q${i + 1}`, state]))

test('透明计数只包含十四道核心题并单列未知', () => {
  const answers = all('stable')
  answers.Q1 = 'unknown'
  answers.Q2 = 'personal'
  answers.R1 = 'missing'
  const result = summarize(answers, 'drug', 'leader')
  assert.deepEqual(result.count, { implemented: 12, substantive: 13, unknown: 1 })
  assert.equal(result.findings[0].dimension, '信息传递与问题闭环')
})

test('未知超过四题时不展示整体计数，未知不当作缺失', () => {
  const answers = all('stable')
  for (let i = 1; i <= 5; i++) answers[`Q${i}`] = 'unknown'
  const result = summarize(answers, 'trade', 'sales')
  assert.equal(result.count, null)
  assert.equal(result.informationInsufficient, true)
  assert.equal(result.findings.length, 0)
})

test('质量问题单独预警且不被其他题目抵消', () => {
  const answers = all('stable')
  answers.Q14 = 'missing'
  const result = summarize(answers, 'api', 'supply')
  assert.equal(result.alerts.length, 1)
  assert.equal(result.alerts[0].id, 'Q14')
})

test('拒绝遗漏题和伪造题号', () => {
  const answers = all('stable')
  delete answers.Q2
  assert.throws(() => validateAnswers(answers))
  answers.Q2 = 'stable'
  answers.Q99 = 'stable'
  assert.throws(() => validateAnswers(answers))
})
