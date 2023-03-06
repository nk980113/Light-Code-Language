module.exports = executeOperators

const checkSyntax = require('../../../Analysis/CheckSyntax')
const { addAndRunChunk } = require('../Actuator')

//執行運算符
function executeOperators (chunk, complexType) {
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
      console.log(true)
    }
    chunk.returnedData = undefined
  }
}