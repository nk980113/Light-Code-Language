import { addAndRunChunk } from '../Actuator.js'

//取得物件
export default function getObject (chunk, complexType) {
  let allKey = Object.keys(complexType.value)
  if (chunk.returnedData === undefined) {
    chunk.executiveData.data = { count: 0, object: {} }
    addAndRunChunk(chunk, complexType.line, true, complexType.value[allKey[0]], chunk.name, 'childChunk')
    return true
  } else {
    chunk.executiveData.data.object[allKey[chunk.executiveData.data.count]] = Object.assign(chunk.returnedData, { mode: complexType.value[allKey[chunk.executiveData.data.count]].mode })
    chunk.executiveData.data.count++
    if (chunk.executiveData.data.count < allKey.length) {
      addAndRunChunk(chunk, complexType.line, true, complexType.value[allKey[chunk.executiveData.data.count]], chunk.name, 'childChunk')
      return true
    } else {
      chunk.returnData = { type: 'object', value: chunk.executiveData.data.object }
      chunk.executiveData.data = {}
      chunk.returnedData = undefined
    }
  }
}