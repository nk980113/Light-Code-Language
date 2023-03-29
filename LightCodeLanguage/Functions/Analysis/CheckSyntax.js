module.exports = checkSyntax

const typesName = require('../TypesName.json')

const relevance = {
  string: ['operators', 'parameters', 'index'],
  number: ['operators', 'index'],
  boolean: [],
  operators: ['string', 'number', 'boolean', 'none', 'nan', 'builtInFunction', 'container', 'array', 'object', 'function', 'expressions', 'parameters', 'promise'],
  none: [],
  nan: [],
  builtInFunction: ['string', 'number', 'boolean', 'none', 'nan', 'builtInFunction', 'container', 'array', 'object', 'function', 'expressions', 'parameters', 'promise'],
  container: ['operators', 'parameters', 'key', 'index'],
  key: ['operators', 'parameters', 'index'],
  array: ['operators', 'parameters', 'index'],
  object: ['operators', 'parameters', 'index'],
  chunk: ['builtInFunction'],
  expressions: ['string', 'number', 'boolean', 'none', 'nan', 'builtInFunction', 'container', 'array', 'object', 'function', 'expressions', 'parameters', 'promise'], //他並不能被"寫"出來，而且應該不用偵測，需要偵測的是他運算的值
  parameters: ['operators', 'chunk', 'parameters', 'index'],
  index: ['operators', 'parameters', 'index'],
}

//檢查語法
function checkSyntax (complexTypes) {
  if (complexTypes.length < 1) return []
  for (let run = 0; run < complexTypes.length-1; run++) {
    if (complexTypes[run].type === ',' || complexTypes[run].type === ':') {
      return { type: 'extraSymbol', symbol: complexTypes[run].type, line: complexTypes[run].line, start: complexTypes[run].start, end: complexTypes[run].end }
    } else if (complexTypes[run+1].type === ',' || complexTypes[run+1].type === ':') {
      return { type: 'extraSymbol', symbol: complexTypes[run+1].type, line: complexTypes[run+1].line, start: complexTypes[run+1].start, end: complexTypes[run+1].end }
    } else if (complexTypes[run].type === 'operators' && (complexTypes[run-1] === undefined || complexTypes[run+1] === undefined) && (complexTypes[run].value.includes('*') || complexTypes[run].value.includes('/') || complexTypes[run].value.includes('=') || complexTypes[run].value.includes('>') || complexTypes[run].value.includes('<'))) {
      return { type: 'mustBeExpressions', operators: complexTypes[run].value, line: complexTypes[run].line, start: complexTypes[run].start, end: complexTypes[run].end }
    } else if (complexTypes[run].type === 'builtInFunction' && (complexTypes[run].value === '變數' || complexTypes[run].value === '的') && complexTypes[run+1].type !== 'container') {
      return { type: 'builtInFunction', functionName: complexTypes[run].value, mustBe: ['<容器>'], line: complexTypes[run+1].line, start: complexTypes[run+1].start, end: complexTypes[run+1].end }
    } else if (complexTypes[run].type === 'builtInFunction' && (complexTypes[run].value === '唯讀' || complexTypes[run].value === '異同步') && (complexTypes[run+1].type !== 'builtInFunction' && complexTypes[run+1].type !== 'container')) {
      return { type: 'builtInFunction', functionName: complexTypes[run].value, mustBe: ['<內建功能>', '<容器>'], line: complexTypes[run+1].line, start: complexTypes[run+1].start, end: complexTypes[run+1].end }
    } else if (complexTypes[run].type === 'builtInFunction' && complexTypes[run].value === '函數' && (complexTypes[run+1].type !== 'container' && complexTypes[run+1].type !== 'parameters')) {
      return { type: 'builtInFunction', functionName: complexTypes[run].value, mustBe: ['<容器>', '<參數列>'], line: complexTypes[run+1].line, start: complexTypes[run+1].start, end: complexTypes[run+1].end }
    } else if (complexTypes[run].type === 'builtInFunction' && complexTypes[run].value === '如果' && (complexTypes[run+1].type !== 'parameters' || complexTypes[run+2] === undefined || complexTypes[run+2].type !== 'chunk')) {
      return { type: 'builtInFunctionNextMustBe', functionName: complexTypes[run].value, mustBe: ['<參數列> <區塊>'], line: complexTypes[run].line, start: complexTypes[run].start, end: complexTypes[run].end }
    } else if (complexTypes[run].type === 'builtInFunction' && complexTypes[run].value === '否則如果' && (complexTypes[run-1] === undefined || complexTypes[run-1].type !== 'chunk' || complexTypes[run-2] === undefined || complexTypes[run-2].type !== 'parameters' || complexTypes[run-3] === undefined || (complexTypes[run-3].type !== 'builtInFunction' && complexTypes[run-3].value !== '如果'))) {
      return { type: 'extraBuiltInFunction', builtInFunction: complexTypes[run].value, line: complexTypes[run+1].line, start: complexTypes[run+1].start, end: complexTypes[run+1].end }
    } else if (complexTypes[run].type === 'builtInFunction' && complexTypes[run].value === '否則如果' && (complexTypes[run+1] === undefined || complexTypes[run+1].type !== 'parameters' || complexTypes[run+2] === undefined || complexTypes[run+2].type !== 'chunk')) {
      return { type: 'builtInFunctionNextMustBe', functionName: complexTypes[run].value, mustBe: ['<參數列> <區塊>'], line: complexTypes[run].line, start: complexTypes[run].start, end: complexTypes[run].end }
    } else if (!relevance[complexTypes[run].type].includes(complexTypes[run+1].type)) {
      if (!((complexTypes[run].type === 'operators' && complexTypes[run].value === '=') && (complexTypes[run+1].type === 'operators' && (complexTypes[run+1].value === '+' || complexTypes[run+1].value === '-')))) {
        return { type: 'notRelevance', typeName: typesName[complexTypes[run].type], typeName2: typesName[complexTypes[run+1].type], line: complexTypes[run+1].line, start: complexTypes[run+1].start, end: complexTypes[run+1].end }
      }
    }
  }
  if (complexTypes[complexTypes.length-1].type === 'operators') return { type: 'extraOperators', operators: complexTypes[complexTypes.length-1].value, line: complexTypes[complexTypes.length-1].line, start: complexTypes[complexTypes.length-1].start, end: complexTypes[complexTypes.length-1].end }
  if (complexTypes[0].type === 'builtInFunction' && (complexTypes[0].value === '變數' || complexTypes[0].value === '的') && complexTypes[1] === undefined) return { type: 'builtInFunction', functionName: complexTypes[0].value, mustBe: ['<容器>'], line: complexTypes[0].line, start: complexTypes[0].start, end: complexTypes[0].end }
  if (complexTypes[0].type === 'builtInFunction' && complexTypes[0].value === '異同步' && complexTypes[1] === undefined) return { type: 'builtInFunction', functionName: complexTypes[0].value, mustBe: ['<內建功能>', '<容器>'], line: complexTypes[0].line, start: complexTypes[0].start, end: complexTypes[0].end }
  if (complexTypes[0].type === 'builtInFunction' && complexTypes[0].value === '函數' && complexTypes[1] === undefined) return { type: 'builtInFunction', functionName: complexTypes[0].value, mustBe: ['<容器>', '<參數列>'], line: complexTypes[0].line, start: complexTypes[0].start, end: complexTypes[0].end }
  if (complexTypes[0].type === 'builtInFunction' && complexTypes[0].value === '如果' && (complexTypes[1] === undefined)) return { type: 'builtInFunctionNextMustBe', functionName: complexTypes[0].value, mustBe: '<參數列> <區塊>', line: complexTypes[0].line, start: complexTypes[0].start, end: complexTypes[0].end }
  return complexTypes
}