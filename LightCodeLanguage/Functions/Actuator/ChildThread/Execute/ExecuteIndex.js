module.exports = executeIndex

const { addAndRunChunk } = require('../Actuator')

//執行索引
function executeIndex (chunk, complexType) {
  if (chunk.returnedData === undefined) {
    chunk.executiveData.data = { count: 0, index: [] }
    addAndRunChunk(chunk, complexType.line, true, complexType.value[0], chunk.name, 'childChunk')
    return true
  } else {
    chunk.executiveData.data.index.push(chunk.returnedData)
    chunk.executiveData.data.count++
    if (chunk.executiveData.data.count < complexType.value.length) {
      addAndRunChunk(chunk, complexType.line, true, complexType.value[chunk.executiveData.data.count], chunk.name, 'childChunk')
      return true
    } else {
      if (chunk.returnData.type === 'string' || chunk.returnData.type === 'number') {
        if (chunk.executiveData.data.index[0].type !== 'number') chunk.returnData = { type: 'none', value: '無' }
        else if (chunk.executiveData.data.index[1].type !== 'number') chunk.returnData = { type: chunk.returnData.type, value: chunk.returnData.value.substring(+chunk.executiveData.data.index[0].value, chunk.returnData.value.length)}
        else chunk.returnData = { type: chunk.returnData.type, value: chunk.returnData.value.substring(+chunk.executiveData.data.index[0].value, +chunk.executiveData.data.index[1].value)}
      } else if (chunk.returnData.type === 'array') {
        if (chunk.executiveData.data.index[0].type === 'number' && chunk.returnData.value[+chunk.executiveData.data.index[0].value] !== undefined) {
          chunk.returnData = (chunk.returnData.container === undefined) ? chunk.returnData.value[+chunk.executiveData.data.index[0].value] :Object.assign(chunk.returnData.value[+chunk.executiveData.data.index[0].value], { container: chunk.returnData.container, path: chunk.returnData.path.concat([{ key: chunk.executiveData.data.index[0].value }])})
        } else {
          chunk.returnData = { type: 'none', value: '無' }
        }
      } else if (chunk.returnData.type === 'object') {
        if (chunk.executiveData.data.index[0].type === 'string' && chunk.returnData.value[chunk.executiveData.data.index[0].value] !== undefined) {
          chunk.returnData = chunk.returnData.value[chunk.executiveData.data.index[0].value]
        } else {
          chunk.returnData = { type: 'none', value: '無' }
        }
      } else {
        throwError(chunk, { error: true, content: `無法從一個 <${typesName[chunk.returnData.type]}> 中使用 <索引> 來讀取值`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
      }
      chunk.executiveData.data = {}
    }
  }
}