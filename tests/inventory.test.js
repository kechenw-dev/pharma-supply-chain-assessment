const test = require('node:test')
const assert = require('node:assert/strict')
const { estimateInventory } = require('../cloudfunctions/assessmentApi/lib/inventory')

test('自报区间按保守端点计算库存周转与占用天数', () => {
  const r = estimateInventory([900, 1100], [180, 220])
  assert.equal(r.turnoverRange[0], 900 / 220)
  assert.equal(r.turnoverRange[1], 1100 / 180)
  assert.equal(r.daysRange[0], 365 * 180 / 1100)
  assert.equal(r.daysRange[1], 365 * 220 / 900)
})

test('零、缺项和倒置区间不计算', () => {
  assert.equal(estimateInventory([0, 100], [10, 20]), null)
  assert.equal(estimateInventory([100, 50], [10, 20]), null)
  assert.equal(estimateInventory(null, [10, 20]), null)
})
