module.exports = getExpressions

const { addAndRunChunk } = require('../Actuator')
const { throwError } = require('../ExecuteLoop')

const getContainer = require('./GetContainer')

//取得運算值
function getExpressionsValue (chunk, complexType) {
  if (complexType.type === 'string') {
    return `'${complexType.value}'`
  } else if (complexType.type === 'number') {
    return complexType.value
  } else if (complexType.type === 'boolean') {
    if (complexType.value === '是') return 1
    else if (complexType.value === '否') return 0
  } else if (complexType.type === 'none' || complexType.type === 'builtInFunction' || complexType.type === 'object' || complexType.type === 'function' || complexType.type === 'externalFunction' || complexType.type === 'promise') {
    return NaN
  } else if (complexType.type === 'container') {
    let container = getContainer(chunk.layer, complexType.value)
    if (container === undefined) throwError(chunk, { error: true, content: `找不到 ${complexType.value}`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : '{執行器}', line: complexType.line }]})
    return getExpressionsValue(chunk, container)
  } else if (complexType.type === 'array') {
    return complexType.value.length
  } else if (complexType.type === 'object') {
    return NaN
  }
}

//取得運算式
function getExpressions (chunk, complexType) {
  if (chunk.returnedData === undefined) {
    chunk.executiveData.data = { count: 0, expressions: [] }
    for (let run = 0; run < complexType.value.length; run++) {
      if (complexType.value[run].type !== 'operators') {
        addAndRunChunk(chunk, complexType.line, true, complexType.value[0], chunk.name, 'normal')
        return true
      } else {
        chunk.executiveData.data.expressions.push(complexType.value[run])
      }
    }
  } else {
    chunk.executiveData.data.expressions.push(chunk.returnedData)
    chunk.executiveData.data.count++
    if (chunk.executiveData.data.count < complexType.value.length) {
      if (complexType.value[chunk.executiveData.data.count].type === 'operators') {
        chunk.returnedData = { type: 'operators', value: complexType.value[chunk.executiveData.data.count].value }
      } else {
        addAndRunChunk(chunk, complexType.line, true, complexType.value[chunk.executiveData.data.count], chunk.name, 'normal')
      }
      return true
    } else {
      let data
      let string = ''
      for (let run = 0; run < chunk.executiveData.data.expressions.length; run++) {
        if (chunk.executiveData.data.expressions[run].type === 'operators') {
          if (chunk.executiveData.data.expressions[run].value === '==') string+='==='
          else if (chunk.executiveData.data.expressions[run].value === '或') string+='||'
          else if (chunk.executiveData.data.expressions[run].value === '且') string+='&&'
          else string+=chunk.executiveData.data.expressions[run].value
        } else {
          data = getExpressionsValue(chunk, chunk.executiveData.data.expressions[run])
          if (isNaN(data)) {
            chunk.returnData = { type: 'nan', value: '非數' }
            return
          }
          string+=data
        }
      }
      data = eval?.(string)
      if (typeof data === 'string') chunk.returnData = { type: 'string', value: data }
      else if (typeof data === 'number') chunk.returnData = { type: 'number', value: `${data}` }
      else if (typeof data === 'boolean') {
        if (data) chunk.returnData = { type: 'boolean', value: '是' }
        else chunk.returnData = { type: 'boolean', value: '否' }
      }
      chunk.executiveData.data = {}
      chunk.returnedData = undefined
    }
  }
}