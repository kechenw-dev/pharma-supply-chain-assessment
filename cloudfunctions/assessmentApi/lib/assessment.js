const CORE_IDS = Array.from({ length: 14 }, (_, i) => `Q${i + 1}`)
const DIMENSIONS = [
  { id: 'communication', title: '信息传递与问题闭环', ids: ['Q1', 'Q2'], hook: '需求变更可能没有统一有效版本，问题也可能停留在口头催办。', action: '抽查一次需求变更与一次异常，核对版本、负责人和关闭记录。' },
  { id: 'planning', title: '需求、生产与物料计划', ids: ['Q3', 'Q4'], hook: '关键物料与普通物料可能按同一节奏管理，计划变更缺少影响核对。', action: '选一项关键物料，核对分级依据、计划更新和变更影响。' },
  { id: 'supplier', title: '采购与供应商布局', ids: ['Q5', 'Q6'], hook: '备用来源或供应商需求确认机制可能不够可靠。', action: '核对一项关键物料的备供资格与最近一次需求确认。' },
  { id: 'inventory', title: '库存与资金压力', ids: ['Q7', 'Q8'], hook: '库存规模、结构与缺料或近效期可能没有放在一起分析。', action: '在同一份清单中对照库存构成、缺料、积压和近效期。' },
  { id: 'delivery', title: '仓储与交付', ids: ['Q9', 'Q10'], hook: '批次或质量状态不清，可能影响可用库存与交付异常处理。', action: '抽查一个批次的来源、状态、库位和一次交付异常记录。' },
  { id: 'data', title: '信息化与数据支持', ids: ['Q11', 'Q12'], hook: '不同表格和系统的口径可能不一致，影响管理层判断。', action: '选一项物料，对照采购、仓储和管理报表的编码与数量。' },
  { id: 'quality', title: '质量与供应风险', ids: ['Q13', 'Q14'], hook: '供应来源变更或未放行物料控制不清，可能影响质量及连续供应。', action: '核对一次变更审批和一次待验／不合格品隔离记录。' }
]
const STATES = ['stable', 'uneven', 'personal', 'missing', 'unknown']
const SEVERITY = { missing: 3, personal: 2, uneven: 1, stable: 0, unknown: -1 }

function validateAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('答卷格式无效')
  for (const id of CORE_IDS) if (!STATES.includes(answers[id])) throw new Error(`${id} 未完成`)
  if (answers.R1 !== undefined && !STATES.includes(answers.R1)) throw new Error('岗位题答案无效')
  for (const id of Object.keys(answers)) if (![...CORE_IDS, 'R1'].includes(id)) throw new Error('答卷含有未知题目')
}

function summarize(answers, businessType, role) {
  validateAnswers(answers)
  const unknown = CORE_IDS.filter(id => answers[id] === 'unknown').length
  const substantive = CORE_IDS.length - unknown
  const stable = CORE_IDS.filter(id => answers[id] === 'stable').length
  const dimensions = DIMENSIONS.map(d => {
    const values = d.ids.map(id => answers[id])
    const known = values.filter(v => v !== 'unknown')
    const worst = known.length ? known.reduce((a, b) => SEVERITY[a] >= SEVERITY[b] ? a : b) : 'unknown'
    return {
      id: d.id,
      title: businessType === 'trade' && d.id === 'planning' ? '需求、补货与配送计划' : d.title,
      answers: d.ids.map(id => ({ id, state: answers[id] })),
      state: worst,
      hook: known.some(v => SEVERITY[v] > 0) ? d.hook : null,
      action: known.some(v => SEVERITY[v] > 0) ? d.action : null,
      unknownCount: values.filter(v => v === 'unknown').length
    }
  })
  const findings = dimensions
    .filter(d => d.hook)
    .sort((a, b) => SEVERITY[b.state] - SEVERITY[a.state] || DIMENSIONS.findIndex(d => d.id === a.id) - DIMENSIONS.findIndex(d => d.id === b.id))
    .slice(0, 3)
    .map(d => ({ dimension: d.title, state: d.state, hook: d.hook, action: d.action, answerIds: d.answers.filter(a => SEVERITY[a.state] > 0).map(a => a.id) }))
  const alerts = ['Q13', 'Q14'].filter(id => ['missing', 'personal', 'uneven'].includes(answers[id])).map(id => ({ id, text: id === 'Q13' ? '变更评估与批准机制需优先核实。' : '待验／未放行／不合格品的隔离控制需优先核实。' }))
  return {
    schemaVersion: '1.0.0', businessType, role,
    count: unknown > 4 ? null : { implemented: stable, substantive, unknown },
    informationInsufficient: unknown > 4,
    unknownCount: unknown,
    dimensions, findings, alerts,
    disclaimer: '本结果仅依据受测者自评，未核实事项须进一步确认；不等同于企业审计或 GMP 合规认定。'
  }
}

module.exports = { CORE_IDS, DIMENSIONS, STATES, validateAnswers, summarize }
