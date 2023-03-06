module.exports = executeParameters

const { actuator, addAndRunChunk } = require('../Actuator')
const { throwError } = require('../ExecuteLoop')
const analysis = require('../../../Analysis/Analysis')

const getContainer = require('../Get/GetContainer')

//執行參數列
function executeParameters (chunk, complexType) {
  if (chunk.executiveData.data.runningFunction === undefined) {
    if (chunk.returnedData === undefined) {
      chunk.executiveData.data = { count: 0, parameters: [], returnedData: undefined }
      addAndRunChunk(chunk, complexType.line, true, complexType.value[0], chunk.name, 'normal')
      return true
    } else {
      chunk.executiveData.data.parameters.push(chunk.returnedData)
      chunk.executiveData.data.count++
      if (chunk.executiveData.data.count < complexType.value.length) {
        addAndRunChunk(chunk, complexType.line, true, complexType.value[chunk.executiveData.data.count], chunk.name, 'normal')
        return true
      } else {
        if (chunk.complexTypes[chunk.executiveData.row-1] === undefined) {
          chunk.returnedData = chunk.executiveData.data.parameters[0]
          chunk.executiveData.data = {}
        } else {
          if (chunk.returnData.type === 'string') {
            let complexTypes = analysis(string.returnData.value)
            if (!Array.isArray(complexType)) throwError(chunk, complexTypes)
            addAndRunChunk(chunk, complexType.line, true, complexTypes, chunk.name, 'normal')
            return true
          } else if (chunk.returnData.type === 'function') {
            let chunk2 = []
            for (let run = 0; run <= chunk.returnData.value.length; run++) {
              if ((chunk.returnData.value === undefined || chunk.returnData.value.type === 'newLine') && chunk2.length > 0) {
                const data = checkSyntax(chunk2)
                if (!Array.isArray(data)) {
                  if (data.type === 'extraSymbol') return { error: true, content: `多出符號 ${data.symbol}`, path: [{ func: '{分析器}' }, { line: data.line }]}
                  if (data.type === 'mustBeExpressions') return { error: true, content: `必須為運算式 (多出運算符 ${data.operators})`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                  if (data.type === 'extraOperators') return { error: true, content: `多出運算符 ${data.operators}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                  if (data.type === 'builtInFunction') return { error: true, content: `<內建功能> ${data.functionName} 的後面只能為一個 ${data.mustBe.join(' 或 ')}`, path: [{ func: '{分析器}' }, { line: data.line }] }
                  return { error: true, content: `語法錯誤 (<${data.typeName}> 的後面不能為 <${data.typeName2}>)`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}  
                }
                chunk2 = []
              } else {
                if (chunk.returnData.value !== undefined && chunk.returnData.value.type !== 'newLine') chunk2.push(chunk.returnData.value)
              }
            }
            chunk2 = addAndRunChunk(chunk, complexType.line, true, chunk.returnData.value, chunk.name, 'normal')
            for (let run = 0; run < chunk.returnData.parameters.length; run++) {
              if (getContainer(chunk.layer, chunk.returnData.parameters[run]) === undefined) {
                if (run < chunk.executiveData.data.parameters.length) chunk2.containers[chunk.returnData.parameters[run]] = chunk.executiveData.data.parameters[run]
                else chunk2.containers[chunk.returnData.parameters[run]] = { type: 'none', value: '無' }
              } else {
                throwError(chunk, { error: true, content: `已經有名為 ${chunk.returnData.parameters[run]} 的容器`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : '{執行器}', line: complexType.line }]})
              }
            }
            chunk.executiveData.data.runningFunction = true
            return true
          } else {
            if (chunk.returnData.container === undefined) {
              throwError(chunk, { error: true, content: `多出了一個 <餐數列>`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : '{執行器}', line: complexType.line }]})
            } else {
              throwError(chunk, { error: true, content: `容器 ${chunk.returnData.container} 不是一個 <函數>`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : '{執行器}', line: complexType.line }]})
            }
          } 
        }
      }
    }
  } else {
    chunk.returnData = chunk.returnedData
    chunk.executiveData.data = {}
  }
}