module.exports = analysis

const analysisSimpleTypes = require('./AnalysisSimpleTypes')
const analysisComplexTypes = require('./AnalysisComplexTypes')
const checkSyntax = require('./CheckSyntax')

//分析
function analysis (code) {
  const simpleTypes = analysisSimpleTypes(code)
  if (!Array.isArray(simpleTypes)) return simpleTypes
  const complexTypes = analysisComplexTypes(simpleTypes)
  if (!Array.isArray(complexTypes)) return complexTypes
  let chunk = []
  for (let run = 0; run <= complexTypes.length; run++) {
    if ((complexTypes[run] === undefined || complexTypes[run].type === 'newLine') && chunk.length > 0) {
      const data = checkSyntax(chunk)
      if (!Array.isArray(data)) {
        if (data.type === 'extraSymbol') return { error: true, content: `多出符號 ${data.symbol}`, path: [{ func: '{分析器}' }, { line: data.line }]}
        if (data.type === 'mustBeExpressions') return { error: true, content: `必須為運算式 (多出運算符 ${data.operators})`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
        if (data.type === 'extraOperators') return { error: true, content: `多出運算符 ${data.operators}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
        if (data.type === 'builtInFunction') return { error: true, content: `<內建功能> ${data.functionName} 的後面只能為一個 ${data.mustBe.join(' 或 ')}`, path: [{ func: '{分析器}' }, { line: data.line }] }
        return { error: true, content: `語法錯誤 (<${data.typeName}> 的後面不能為 <${data.typeName2}>)`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}  
      }
      chunk = []
    } else {
      if (complexTypes[run] !== undefined && complexTypes[run].type !== 'newLine') chunk.push(complexTypes[run])
    }
  }
  return complexTypes
}