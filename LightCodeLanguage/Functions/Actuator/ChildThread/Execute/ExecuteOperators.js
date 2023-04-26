import checkSyntax from '../../../Analysis/CheckSyntax.js'
import { actuator, addAndRunChunk } from '../Actuator.js'
import { throwError } from '../ExecuteLoop.js'

import typesName from '../../../TypesName.json' assert { type: 'json' }
import getContainer from '../Get/GetContainer.js'

//執行運算符
export default function executeOperators (chunk, complexType) {
  if (chunk.returnedData === undefined) {
    let chunk2 = [chunk.complexTypes[chunk.executiveData.row+1]]
    chunk.executiveData.skip = (chunk.executiveData.row+4)-chunk.executiveData.row
    for (let run = chunk.executiveData.row+2; run < chunk.complexTypes.length; run++) {
      if (!Array.isArray(checkSyntax(chunk2.concat(chunk.complexTypes[run])))) {
        chunk.executiveData.skip = run-chunk.executiveData.row
        break
      } else {
        if (chunk.complexTypes[run].type !== 'newLine') chunk2.push(chunk.complexTypes[run])
      }
    }
    addAndRunChunk(chunk, complexType.line, true, chunk2, chunk.name, 'normal')
    return true
  } else {
    chunk.executiveData.row += chunk.executiveData.skip-1
    if (complexType.value === '+') {
      if (chunk.returnedData.type === 'string') {
        if (isNaN(+chunk.returnedData.value)) chunk.returnData = { type: 'nan', value: '非數' }
        else chunk.returnData = { type: 'number', value: chunk.returnedData.value }
      } else if (chunk.returnedData.type === 'number') {
        chunk.returnData = { type: 'number', value: `${chunk.returnedData.value}` }
      } else if (chunk.returnedData.type === 'boolean') {
        if (chunk.returnData.value === '是') chunk.returnData = { type: 'number', value: '1' }
        else chunk.returnData = { type: 'number', value: '0' }
      } else if (chunk.returnedData.type === 'none') {
        chunk.returnData = { type: 'number', value: '0' }
      } else if (chunk.returnData.type === 'array') {
        chunk.returnData = { type: 'number', value: `${chunk.returnData.value.length}` }
      } else {
        chunk.returnData = { type: 'nan', value: '非數值' }
      }
    } else if (complexType.value === '-') {
      if (chunk.returnedData.type === 'string') {
        if (isNaN(+chunk.returnedData.value)) chunk.returnData = { type: 'nan', value: '非數' }
        else chunk.returnData = { type: 'number', value: `-${chunk.returnedData.value}` }
      } else if (chunk.returnedData.type === 'number') {
        chunk.returnData = { type: 'number', value: `-${chunk.returnedData.value}` }
      } else if (chunk.returnedData.type === 'boolean') {
        if (chunk.returnData.value === '是') chunk.returnData = { type: 'number', value: '-1' }
        else chunk.returnData = { type: 'number', value: '-0' }
      } else if (chunk.returnedData.type === 'none') {
        chunk.returnData = { type: 'number', value: '-0' }
      } else if (chunk.returnData.type === 'array') {
        chunk.returnData = { type: 'number', value: `-${chunk.returnData.value.length}` }
      } else {
        chunk.returnData = { type: 'nan', value: '非數值' }
      }
    } else if (complexType.value === '=') {
      if (chunk.returnData.container === undefined) {
        throwError(chunk, { error: true, content: `${typesName[chunk.returnData.type]} 不被存在於任何容器內`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
      } else if (chunk.returnData.mode === 'readOnly') {
        let path = chunk.returnData.container
        for (let run2 = 0; run2 < chunk.returnData.path.length; run2++) {
          if (chunk.returnData.path[run2].key !== undefined) path += `.${chunk.returnData.path[run2].key}`
          else if (chunk.returnData.path[run2].index !== undefined) path += `[${chunk.returnData.path[run2].key}]`
        }
        throwError(chunk, { error: true, content: `容器 ${path} 為唯讀容器`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
      } else {
        let container = getContainer(chunk.layer, chunk.returnData.container)
        if (container === undefined) throwError(chunk, { error: true, content: `找不到 ${chunk.returnData.container}`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
        if (chunk.returnData.path.length > 0) {
          for (let run = 0; run < chunk.returnData.path.length-1; run++) {
            if (chunk.returnData.path[run].key !== undefined) {
              if (container === undefined || container.type !== 'object') throwError(chunk, { error: true, content: `無法從一個 <${(container === undefined) ? '無' : typesName[container.type]}> 中使用 <鑰> 來讀取值`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
              container = container.value[chunk.returnData.path[run].key]
            } else if (chunk.returnData.path[run].index !== undefined) {
              if (container === undefined || (container.type !== 'string' && container.type !== 'number' && container.type !== 'array' && container.type !== 'object')) throwError(chunk, { error: true, content: `無法從一個 <${typesName[chunk.returnData.type]}> 中使用 <索引> 來讀取值`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
              container = container.value[chunk.returnData.path[run].index]
            }
          }
          if (chunk.returnData.path[chunk.returnData.path.length-1].key !== undefined) container.value[chunk.returnData.path[chunk.returnData.path.length-1].key] = chunk.returnedData
          else if (chunk.returnData.path[chunk.returnData.path.length-1].index !== undefined) container.value[chunk.returnData.path[chunk.returnData.path.length-1].index] = chunk.returnedData
        } else {
          actuator.chunks[container.chunkId].containers[chunk.returnData.container] = chunk.returnedData
        }
        container = chunk.returnedData
        chunk.returnData = chunk.returnedData
      }
    }
    chunk.returnedData = undefined
  }
}