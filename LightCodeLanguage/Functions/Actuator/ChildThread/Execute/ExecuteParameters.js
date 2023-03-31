module.exports = executeParameters

const { actuator, addAndRunChunk } = require('../Actuator')
const { throwError } = require('../ExecuteLoop')
const analysis = require('../../../Analysis/Analysis')

const getContainer = require('../Get/GetContainer')
const executeExternalFunction = require('./ExecuteExternalFunction')

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
        addAndRunChunk(chunk, complexType.line, true, complexType.value[chunk.executiveData.data.count], chunk.name, 'childChunk')
        return true
      } else {
        if (chunk.complexTypes[chunk.executiveData.row-1] === undefined) {
          chunk.returnData = chunk.executiveData.data.parameters[0]
          chunk.executiveData.data = {}
        } else {
          if (chunk.returnData.type === 'string') {
            let complexTypes = analysis(chunk.returnData.value)
            if (!Array.isArray(complexType)) throwError(chunk, complexTypes)
            addAndRunChunk(chunk, complexType.line, true, complexTypes, chunk.name, 'normal')
            return true
          } else if (chunk.returnData.type === 'function') {
            let chunk2
            if (chunk.returnData.async) {
              if (chunk.executiveData.mode === 'wait') chunk2 = addAndRunChunk(chunk, complexType.line, true, chunk.returnData.value, (chunk.returnData.container === undefined) ? '函數' : chunk.returnData.container, 'chunk')
              else chunk2 = addAndRunChunk(chunk, complexType.line, false, chunk.returnData.value, (chunk.returnData.container === undefined) ? '函數' : chunk.returnData.container, 'chunk')
            } else {
              if (chunk.executiveData.mode === 'async') chunk2 = addAndRunChunk(chunk, complexType.line, false, chunk.returnData.value, (chunk.returnData.container === undefined) ? '函數' : chunk.returnData.container, 'chunk')
              else chunk2 = addAndRunChunk(chunk, complexType.line, true, chunk.returnData.value, (chunk.returnData.container === undefined) ? '函數' : chunk.returnData.container, 'chunk')
            }
            for (let run = 0; run < chunk.returnData.parameters.length; run++) {
              if (getContainer(chunk.layer, chunk.returnData.parameters[run]) === undefined) {
                if (run < chunk.executiveData.data.parameters.length) chunk2.containers[chunk.returnData.parameters[run]] = chunk.executiveData.data.parameters[run]
                else chunk2.containers[chunk.returnData.parameters[run]] = { type: 'none', value: '無' }
              } else {
                throwError(chunk, { error: true, content: `已經有名為 ${chunk.returnData.parameters[run]} 的容器`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
              }
            }
            chunk.executiveData.data.runningFunction = true
            return true
          } else if (chunk.returnData.type === 'externalFunction') {
            executeExternalFunction(chunk, chunk.returnData, chunk.executiveData.data.parameters)
          } else {
            if (chunk.returnData.container === undefined) {
              throwError(chunk, { error: true, content: `多出了一個 <參數列>`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
            } else {
              throwError(chunk, { error: true, content: `容器 ${chunk.returnData.container} 不是一個 <函數>`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
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