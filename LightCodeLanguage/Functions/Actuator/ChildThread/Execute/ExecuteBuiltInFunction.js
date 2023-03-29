module.exports = executeBuiltInFunction

const { actuator, addAndRunChunk } = require('../Actuator')
const { removeTesk, throwError } = require('../ExecuteLoop')
const checkSyntax = require('../../../Analysis/CheckSyntax')
const getContainer = require('../Get/GetContainer')

//執行內建函數
function executeBuiltInFunction (chunk, complexType) {
  if (complexType.value === '變數') {
    if (chunk.returnedData === undefined) {
      if (chunk.complexTypes[chunk.executiveData.row+1] === undefined) {
        throwError(chunk, { error: true, content: `後面必須為一個 <容器>`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
      } else {
        let container = getContainer(chunk.layer, chunk.complexTypes[chunk.executiveData.row+1].value)
        if (container === undefined) {
          if (chunk.complexTypes[chunk.executiveData.row+2] !== undefined && chunk.complexTypes[chunk.executiveData.row+2].type === 'operators' && chunk.complexTypes[chunk.executiveData.row+2].value === '=') {
            let chunk2 = [chunk.complexTypes[chunk.executiveData.row+3]]
            chunk.executiveData.skip = (chunk.executiveData.row+4)-chunk.executiveData.row
            for (let run = chunk.executiveData.row+4; run < chunk.complexTypes.length; run++) {
              if (!Array.isArray(checkSyntax(chunk2.concat(chunk.complexTypes[run])))) {
                chunk.executiveData.skip = run-chunk.executiveData.row
                break
              } else {
                if (chunk.complexTypes[run].type !== 'newLine') chunk2.push(chunk.complexTypes[run])
              }
            }
            chunk.executiveData.data = { mode: (chunk.executiveData.mode === 'readOnly') ? 'readOnly' : 'childChunk' }
            addAndRunChunk(chunk, complexType.line, true, chunk2, chunk.name, 'childChunk')
            return true
          } else {
            chunk.containers[chunk.complexTypes[chunk.executiveData.row+1].value] = { type: 'none', value: '無' , mode: (chunk.executiveData.mode === 'readOnly') ? 'readOnly' : 'childChunk' }
            chunk.returnData = { type: 'none', value: '無', container: chunk.complexTypes[chunk.executiveData.row+1].value, path: [] }
            chunk.executiveData.mode = undefined
            chunk.executiveData.row += 1
          }
        } else {
          throwError(chunk, { error: true, content: `已經有名為 ${chunk.complexTypes[chunk.executiveData.row+1].value} 的容器`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
        }
      }
    } else {
      chunk.containers[chunk.complexTypes[chunk.executiveData.row+1].value] = Object.assign(chunk.returnedData, { mode: (chunk.executiveData.mode === 'readOnly') ? 'readOnly' : 'childChunk' })
      chunk.returnData = chunk.containers[chunk.complexTypes[chunk.executiveData.row+1].value]
      chunk.executiveData.mode = undefined
      chunk.executiveData.data = {}
      chunk.returnedData = undefined
      chunk.executiveData.row += chunk.executiveData.skip
    }
  } else if (complexType.value === '唯讀') {
    if (chunk.complexTypes[chunk.executiveData.row+1].type !== 'builtInFunction' && chunk.complexTypes[chunk.executiveData.row+1].type !== 'container') throwError(chunk, { error: true, content: `<內建功能> 唯讀 的後面只能為一個 <內建功能> 或 <容器>(在物件裡)`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
    chunk.executiveData.mode = 'readOnly'
  } else if (complexType.value === '等待') {
    chunk.executiveData.mode = 'wait'
  } else if (complexType.value === '函數') {
    if (chunk.complexTypes[chunk.executiveData.row+1] === undefined) throwError(chunk, { error: true, content: `<內建功能> 函數 的後面只能為一個 <容器> 或 <參數列>`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
    if (chunk.complexTypes[chunk.executiveData.row+1].type === 'container') {
      if (chunk.complexTypes[chunk.executiveData.row+2] === undefined || chunk.complexTypes[chunk.executiveData.row+2].type !== 'parameters' || chunk.complexTypes[chunk.executiveData.row+3].type !== 'chunk') {
        throwError(chunk, { error: true, content: `創建函數的格式錯誤 (必須為 "函數 <容器> <參數列> <區塊>" 或 "函數 <參數列> <區塊>")`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
      } else {
        let container = getContainer(chunk.layer, chunk.complexTypes[chunk.executiveData.row+1].value)
        if (container === undefined) {
          let parameters = []
          if (parameters.length > 0) {
            for (let run = 0; run < chunk.complexTypes[chunk.executiveData.row+2].value.length; run++) {
              if (chunk.complexTypes[chunk.executiveData.row+2].value[run][0].type !== 'container' || chunk.complexTypes[chunk.executiveData.row+2].value[run].length > 1) {
                throwError(chunk, { error: true, content: `函數的參數列的第 ${run} 項只能為一個 <容器> (容器名)`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
              } else {
                parameters.push(chunk.complexTypes[chunk.executiveData.row+2].value[run][0].value)
              }
            }
          }
          chunk.containers[chunk.complexTypes[chunk.executiveData.row+1].value] = { type: 'function', async: chunk.executiveData.mode === 'async', parameters, value: chunk.complexTypes[chunk.executiveData.row+3].value, mode: 'readOnly' }
          chunk.returnData = getContainer(chunk.layer, chunk.complexTypes[chunk.executiveData.row+1].value)
          chunk.executiveData.mode = undefined
          chunk.executiveData.row+=3
        } else {
          throwError(chunk, { error: true, content: `已經有名為 ${chunk.complexTypes[chunk.executiveData.row+1].value} 的容器`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
        }
      }
    } else if (chunk.complexTypes[chunk.executiveData.row+1].type === 'parameters') {
      if (chunk.complexTypes[chunk.executiveData.row+2].type === 'chunk') {
        let parameters = []
        for (let run = 0; run < chunk.complexTypes[chunk.executiveData.row+1].value.length; run++) {
          if (chunk.complexTypes[chunk.executiveData.row+1].value[run][0].type !== 'container' || chunk.complexTypes[chunk.executiveData.row+1].value[run].length > 1) {
            throwError(chunk, { error: true, content: `函數的參數列的第 ${run} 項只能為一個 <容器> (容器名)`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
          } else {
            parameters.push(chunk.complexTypes[chunk.executiveData.row+1].value[run][0].value)
          }
        }
        chunk.returnData = { parameters, async: chunk.executiveData.mode === 'async', value: chunk.complexTypes[chunk.executiveData.row+2].value }
        chunk.executiveData.mode = undefined
        chunk.executiveData.row+=2
      } else {
        throwError(chunk, { error: true, content: `創建函數的格式錯誤 (必須為 "函數 <容器> <參數列> <區塊>" 或 "函數 <參數列> <區塊>")`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
      }
    }
  } else if (complexType.value === '異同步') {
    if (!(chunk.complexTypes[chunk.executiveData.row+1].type === 'builtInFunction' && chunk.complexTypes[chunk.executiveData.row+1].value === '函數') && chunk.complexTypes[chunk.executiveData.row+1].type !== 'container') throwError(chunk, { error: true, content: `<內建功能> 異同步 的後面只能為一個 <內建功能> 函數 或 <容器>()`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
    chunk.executiveData.mode = 'async'
  } else if (complexType.value === '返回') {
    if (chunk.returnedData === undefined) {
      let chunk2 = [chunk.complexTypes[chunk.executiveData.row+1]]
      for (let run = chunk.executiveData.row+2; run < chunk.complexTypes.length; run++) {
        if (!Array.isArray(checkSyntax(chunk2.concat(chunk.complexTypes[run])))) {
          break
        } else {
          if (chunk.complexTypes[run].type !== 'newLine') chunk2.push(chunk.complexTypes[run])
        }
      }
      addAndRunChunk(chunk, complexType.line, true, chunk2, chunk.name, 'childChunk')
      return true
    } else {
      chunkOut(chunk, true)
    } 
  } else if (complexType.value === '重複') {
    if (chunk.executiveData.data.condition === undefined) {
      if (chunk.returnedData === undefined) {
        if (chunk.complexTypes[chunk.executiveData.row+1].type !== 'parameters' && chunk.complexTypes[chunk.executiveData.row+2].type !== 'chunk') throwError(chunk, { error: true, content: `<內建功能> 唯讀 的後面只能為一個 <內建功能> 或 <容器>(在物件裡)`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
        chunk.executiveData.data = { condition: undefined, newCondition: undefined, count: 0 }
        addAndRunChunk(chunk, complexType.line, true, [chunk.complexTypes[chunk.executiveData.row+1]], chunk.name, 'childChunk')
        return true
      } else {
        if (chunk.returnedData.type !== 'number' && chunk.returnedData.type !== 'boolean') throwError(chunk, { error: true, content: `給予 <內建功能> 重複 的值只能為 <數字> 或 <布林值>`, start: chunk.complexTypes[chunk.executiveData.row+1].start, end: chunk.complexTypes[chunk.executiveData.row+1].end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: chunk.complexTypes[chunk.executiveData.row+1].line }]})
        chunk.executiveData.data.condition = chunk.returnedData
        chunk.executiveData.data.newCondition = chunk.returnedData
        addAndRunChunk(chunk, complexType.line, true, [chunk.complexTypes[chunk.executiveData.row+2]], chunk.name, 'childChunk')
        return true
      }
    } else {
      if (chunk.executiveData.data.newCondition === undefined) {
        if (chunk.returnedData === undefined) {
          addAndRunChunk(chunk, complexType.line, true, [chunk.complexTypes[chunk.executiveData.row+1]], chunk.name, 'childChunk')
          return true
        } else {
          chunk.executiveData.data.newCondition = chunk.returnedData
          chunk.returnedData = undefined
          return true
        }
      } else {
        if (chunk.returnedData === undefined) {
          if ((chunk.executiveData.data.condition.type === 'number' && chunk.executiveData.data.count >= chunk.executiveData.data.condition.value) || (chunk.executiveData.data.condition.type === 'boolean' && chunk.executiveData.data.condition.value === '否')) {
            chunk.executiveData.row+=2
          } else {
            if (chunk.executiveData.data.condition.type === 'number') chunk.executiveData.data.count++
            addAndRunChunk(chunk, complexType.line, true, chunk.complexTypes[chunk.executiveData.row+2].value, '{重複}', 'childChunk')
            return true
          }
        } else {
          chunk.executiveData.data.condition = chunk.executiveData.data.newCondition
          chunk.executiveData.data.newCondition = undefined
          chunk.returnedData = undefined
          return true
        }
      }
    }
  } else if (complexType.value === '如果') {
    if (chunk.executiveData.data.conditions === undefined) {
      chunk.executiveData.data = { conditions: [{ type: 'if', parameters: chunk.complexTypes[chunk.executiveData.row+1], chunk: chunk.complexTypes[chunk.executiveData.row+2] }], state: 'runParameters', count: 1 }
      chunk.executiveData.skip = 2
      for (let run = chunk.executiveData.row+3; run < chunk.complexTypes.length; run++) {
       if (chunk.complexTypes[run].type === 'builtInFunction' && chunk.complexTypes[run].value === '否則' && chunk.complexTypes[run+1].type === 'chunk') {
          chunk.executiveData.data.conditions.push({ type: 'else', chunk: chunk.complexTypes[run+2] })
          chunk.executiveData.skip+=1
          run+=1
        } else if (chunk.complexTypes[run].type === 'builtInFunction' && chunk.complexTypes[run].value === '否則如果' && chunk.complexTypes[run+1].type === 'parameters' && chunk.complexTypes[run+2].type === 'chunk') {
          chunk.executiveData.data.conditions.push({ type: 'elseif', parameters: chunk.complexTypes[run+1], chunk: chunk.complexTypes[run+2] })
          chunk.executiveData.skip+=2
          run+=2
        } else {
          break
        }
      }
      addAndRunChunk(chunk, complexType.line, true, [chunk.executiveData.data.conditions[0].parameters], chunk.name, 'childChunk')
      return true
    } else {
      if (chunk.executiveData.data.state === 'runParameters') {
        if (chunk.returnedData.type === 'boolean' && chunk.returnedData.value === '是') {
          chunk.executiveData.data.state = 'runChunk'
          addAndRunChunk(chunk, complexType.line, true, chunk.executiveData.data.conditions[chunk.executiveData.data.count].chunk.complexTypes, chunk.name, 'childChunk')
          return true
        } else {
          chunk.executiveData.data.count++
          if (chunk.executiveData.data.count < chunk.executiveData.data.conditions) {
            if (chunk.executiveData.data.conditions[chunk.executiveData.data.count].type === 'elseif') {
              chunk.executiveData.data.state = 'runParameters'
              addAndRunChunk(chunk, complexType.line, true, [chunk.executiveData.data.conditions[chunk.executiveData.data.count].parameters], chunk.name, 'childChunk')
              return true
            } else {
              chunk.executiveData.data.state = 'runChunk'
              addAndRunChunk(chunk, complexType.line, true, chunk.executiveData.data.conditions[chunk.executiveData.data.count].chunk.complexTypes, chunk.name, 'childChunk')
              return true
            }
          } else {
            chunk.returnedData = undefined
            chunk.executiveData.data = {}
            chunk.executiveData.row += chunk.executiveData.skip
          }
        }
      } else if (chunk.executiveData.data.state === 'runChunk') {
        chunk.returnedData = undefined
        chunk.executiveData.data = {}
        chunk.executiveData.row += chunk.executiveData.skip
      }
    }
  }
}

//退出區塊
function chunkOut (chunk, first) {
  if (chunk.type === 'chunk') {
    if (chunk.id === 'main') {
      actuator.returnData = (first) ? chunk.returnedData : { type: 'none', value: '無' }
    } else if (actuator.chunks[chunk.directTo[0].id].state === `wait-${chunk.id}`) {
      console.log(chunk.returnedData)
      actuator.chunks[chunk.directTo[0].id].returnData = (first && chunk.returnedData !== undefined) ? chunk.returnedData : { type: 'none', value: '無' }
      actuator.chunks[chunk.directTo[0].id].executiveData.row = Infinity
      actuator.chunks[chunk.directTo[0].id].state = 'running'
    }
    delete actuator.chunks[chunk.id]
    removeTesk(chunk.id)
  } else {
    for (let run = 0; run < chunk.directTo.length; run++) {
      if (actuator.chunks[chunk.directTo[run].id].type === 'chunk') {
        actuator.chunks[chunk.directTo[run].id].returnedData = chunk.returnedData
        chunkOut(actuator.chunks[chunk.directTo[run].id], true)
        break
      } else {
        delete actuator.chunks[chunk.directTo[run].id]
        removeTesk(chunk.directTo[run].id)
      }
    }
    delete actuator.chunks[chunk.id]
    removeTesk(chunk.id)
  }
}