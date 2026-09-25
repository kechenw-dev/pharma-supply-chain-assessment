const test = require('node:test')
const assert = require('node:assert/strict')
const { adaptedQuestions, prioritizeQuestions } = require('../miniprogram/data/questions')

test('场景入口优先展示相关问题，同时保留全部核心题与岗位题', () => {
  const original = adaptedQuestions('drug', 'supply')
  const reordered = prioritizeQuestions(original, 'inventory')
  assert.deepEqual(reordered.slice(0, 2).map(q => q.id), ['Q7', 'Q8'])
  assert.equal(reordered.length, original.length)
  assert.deepEqual(new Set(reordered.map(q => q.id)), new Set(original.map(q => q.id)))
  assert.equal(reordered.at(-1).id, 'R1')
})
