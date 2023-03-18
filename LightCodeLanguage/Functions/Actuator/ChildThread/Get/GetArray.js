module.exports = getArray

const { addAndRunChunk } = require('../Actuator')

//取得陣列
function getArray (chunk, complexType) {
  if (chunk.returnedData === undefined) {
    chunk.executiveData.data = { count: 0, array: [] }
    addAndRunChunk(chunk, complexType.line, true, complexType.value[0], chunk.name, 'childChunk')
    return true
  } else {
    chunk.executiveData.data.array.push(chunk.returnedData)
    chunk.executiveData.data.count++
    if (chunk.executiveData.data.count < complexType.value.length) {
      addAndRunChunk(chunk, complexType.line, true, complexType.value[chunk.executiveData.data.count], chunk.name, 'childChunk')
      return true
    } else {
      chunk.returnData = { type: 'array', value: chunk.executiveData.data.array }
      chunk.executiveData.data = {}
      chunk.returnedData = undefined
    }
  }
}