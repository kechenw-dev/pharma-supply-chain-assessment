function validRange(range) {
  return Array.isArray(range) && range.length === 2 && range.every(n => Number.isFinite(n) && n > 0) && range[0] <= range[1]
}

function estimateInventory(costRange, inventoryRange) {
  if (!validRange(costRange) || !validRange(inventoryRange)) return null
  const [cLow, cHigh] = costRange
  const [iLow, iHigh] = inventoryRange
  return {
    turnoverRange: [cLow / iHigh, cHigh / iLow],
    daysRange: [365 * iLow / cHigh, 365 * iHigh / cLow],
    formula: '库存周转率＝同期营业成本／同期平均总库存；库存天数＝365／库存周转率',
    source: 'APQC 365 天库存天数口径；输入为客户自报估算区间',
    confidence: '区间估算，非统计置信区间'
  }
}

module.exports = { validRange, estimateInventory }
