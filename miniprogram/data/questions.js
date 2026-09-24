const OPTIONS = [
  { value: 'stable', label: '有明确做法，持续执行且能查到记录' },
  { value: 'uneven', label: '有做法，但执行不稳定或记录不完整' },
  { value: 'personal', label: '主要靠个人催办、经验或临时沟通' },
  { value: 'missing', label: '基本没有固定做法' },
  { value: 'unknown', label: '不清楚' }
]

const BUSINESS_TYPES = [
  { value: 'drug', label: '药品生产企业' },
  { value: 'api', label: '原料药／中间体／辅料生产企业' },
  { value: 'mah_cdmo', label: 'MAH／CDMO（委托或受托生产）' },
  { value: 'trade', label: '贸易／流通企业' }
]

const ROLES = [
  { value: 'leader', label: '企业老板／管理层' },
  { value: 'supply', label: '供应链／采购' },
  { value: 'production', label: '生产／研发／质量' },
  { value: 'sales', label: '销售／客户服务' },
  { value: 'other', label: '其他医药相关岗位' }
]

const DIMENSIONS = [
  { id: 'communication', title: '信息传递与问题闭环' },
  { id: 'planning', title: '需求、生产与物料计划' },
  { id: 'supplier', title: '采购与供应商布局' },
  { id: 'inventory', title: '库存与资金压力' },
  { id: 'delivery', title: '仓储与交付' },
  { id: 'data', title: '信息化与数据支持' },
  { id: 'quality', title: '质量与供应风险' }
]

const QUESTIONS = [
  { id: 'Q1', dimension: 'communication', text: '订单需求、技术规格或交期发生变更时，企业是否有统一的变更登记和版本发布机制，让相关部门及供应商依据同一有效版本执行？', mah: '委托方或受托方的需求、技术规格或交期变更时，是否有统一登记、批准和发布有效版本的机制，让双方及相关部门依据同一版本执行？' },
  { id: 'Q2', dimension: 'communication', text: '发生缺料、延期或质量问题后，是否能查到负责人、解决期限、处理进度和最终关闭结果？' },
  { id: 'Q3', dimension: 'planning', text: '企业是否按物料对质量、供应连续性和资金占用的影响进行分级，并为不同级别设置计划复核、备货和预警规则？', trade: '企业是否按商品或关键货源对供应连续性、效期和资金占用的影响进行分级，并为不同级别设置补货、检查和预警规则？' },
  { id: 'Q4', dimension: 'planning', text: '需求或生产安排变化时，是否有固定的计划更新节奏、变更审批和版本管理规则，并记录对采购与物料供应的影响？', trade: '客户需求或配送安排变化时，是否有固定的补货计划更新、变更确认和版本管理规则，并记录对采购与库存的影响？', mah: '委托生产需求或产能安排变化时，双方是否按约定机制更新计划、批准变更，并记录对采购、物料和交付的影响？' },
  { id: 'Q5', dimension: 'supplier', text: '关键物料的供应来源是否按重要性和风险进行布局，明确主供（主要供应商）、备供（备用供应商）及切换条件，并定期核实实际供货能力？', trade: '关键商品或货源是否明确主要供应商、备用来源和切换条件，并定期核实实际供货能力？' },
  { id: 'Q6', dimension: 'supplier', text: '供应商是否通过约定机制获取有效版本的需求、订单和发货安排，并确认可交付数量、日期及异常反馈？' },
  { id: 'Q7', dimension: 'inventory', text: '企业是否定期掌握库存的大致规模，以及原料、在制品、成品等库存的构成，并能解释明显变化？', trade: '企业是否定期掌握商品库存的大致规模、品类和效期结构，并能解释明显变化？' },
  { id: 'Q8', dimension: 'inventory', text: '企业是否跟踪库存周转、缺料、积压和近效期情况，并据此调整采购、生产或补货计划？', trade: '企业是否跟踪商品库存周转、缺货、积压和近效期情况，并据此调整采购与补货计划？' },
  { id: 'Q9', dimension: 'delivery', text: '收货后，是否能清楚追踪每批物料的来源、库位、数量和可使用状态，避免拿错或提前使用？', trade: '收货后，是否能清楚追踪每批商品的来源、库位、数量、效期和可销售状态，避免误发？' },
  { id: 'Q10', dimension: 'delivery', text: '订单交付可能延期、运输条件异常或客户收到问题货物时，相关部门是否能及时预警并追踪处理结果？' },
  { id: 'Q11', dimension: 'data', text: '同一种物料或同一家供应商在不同表格、系统和部门之间，名称、编码、规格是否保持一致？' },
  { id: 'Q12', dimension: 'data', text: '负责人需要判断缺料、库存、延期和供应风险时，能否及时拿到同一口径的数据，并据此记录决策和后续结果？' },
  { id: 'Q13', dimension: 'quality', text: '更换供应商、物料、生产地点或重要工艺前，是否会让质量等相关部门评估影响并批准后执行？', trade: '更换供应商、商品来源或影响客户要求的条件前，是否由相关部门评估质量与交付影响，并按约定通知和批准？' },
  { id: 'Q14', dimension: 'quality', text: '待检、未放行或不合格的物料／产品，是否能在现场和系统中被清楚识别并阻止误用、误发？', trade: '待验、不可销售或不合格的商品，是否能在仓库和系统中被清楚识别并阻止误发？' }
]

const ROLE_QUESTIONS = {
  leader: '负责人能否定期看到主要供应链风险、库存资金压力及改善责任人的跟进结果？',
  supply: '紧急采购与重复催货是否有原因分类，并用于改善计划和供应商协同？',
  production: '需求、物料或供应商发生变化时，是否能及时看到影响评估与批准状态？',
  sales: '向客户承诺交期前，是否能看到可信的库存、供应和发运信息？',
  other: '跨部门处理供应链问题时，是否能找到有效信息、负责人及处理结果？'
}

function adaptedQuestions(businessType, role) {
  return QUESTIONS.map(q => ({ id: q.id, dimension: q.dimension, text: businessType === 'trade' && q.trade ? q.trade : businessType === 'mah_cdmo' && q.mah ? q.mah : q.text }))
    .concat(role && ROLE_QUESTIONS[role] ? [{ id: 'R1', dimension: 'role', text: ROLE_QUESTIONS[role] }] : [])
}

module.exports = { OPTIONS, BUSINESS_TYPES, ROLES, DIMENSIONS, QUESTIONS, ROLE_QUESTIONS, adaptedQuestions }
