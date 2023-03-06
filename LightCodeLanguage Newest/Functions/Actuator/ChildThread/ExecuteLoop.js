module.exports = { executeLoop, arrangeTasks, throwError }

const { addInterval, removeInterval } = require('../../Tools/Timer')

const { actuator, sendMessage } = require('./Actuator')
const actuatorLog = require('./ActuatorLog')
const checkVMemory = require('./VMemoryManager')

const getContainer = require('./Get/GetContainer')
const getArray = require('./Get/GetArray')
const getObject = require('./Get/GetObject')
const getExpressions = require('./Get/GetExpressions')

const executeOperators = require('./Execute/ExecuteOperators')
const executeBuiltInFunction = require('./Execute/ExecuteBuiltInFunction')
const executeParameters = require('./Execute/ExecuteParameters')
const executeKey = require('./Execute/ExecuteKey')
const executeIndex = require('./Execute/ExecuteIndex')

//安排任務
function arrangeTasks (cps, chunks) {
  let tasks = [[]]
  let allKey = Object.keys(chunks)
  allKey.map((item) => {
    if (tasks[tasks.length-1].length >= cps) tasks.push([])
    tasks[tasks.length-1].push(item)
  })
  return tasks
}

//執行循環
function executeLoop () {
  actuatorLog('running', '開始執行')
  actuator.executiveData.tasks = arrangeTasks(actuator.settings.cps, actuator.chunks)
  addInterval(actuator.settings.interval, () => {
    if (actuator.state === 'stopping') {
      actuatorLog('complete', '以停止執行')
      sendMessage({ type: 'executionStop', data: actuator.returnData })
      process.exit()
    } else if (actuator.executiveData.tasks.length <= 1 && actuator.executiveData.tasks[0].length < 1) {
      actuatorLog('complete', '執行完成')
      sendMessage({ type: 'executionStop', data: actuator.returnData })
      process.exit()
    } else {
      if (actuator.executiveData.nowTask >= actuator.executiveData.tasks.length) actuator.executiveData.nowTask = 0
      actuator.executiveData.tasks[actuator.executiveData.nowTask].map((item) => {if (actuator.chunks[item].state === 'running') runChunk(actuator.chunks[item])})
      actuator.executiveData.nowTask++
      checkVMemory()
    }
  })
}

//運行區塊
function runChunk (chunk) {
  if (actuator.state === 'stopping') return
  let complexType = chunk.complexTypes[chunk.executiveData.row]
  if (complexType === undefined) {
    if (chunk.directTo !== undefined) {
      if ((chunk.type === `async` && actuator.chunks[chunk.directTo[chunk.directTo.length-1].id].state === `syncWait-${chunk.id}`) || (chunk.type === `normal` && actuator.chunks[chunk.directTo[chunk.directTo.length-1].id].state === `wait-${chunk.id}`)) {
        actuator.chunks[chunk.directTo[chunk.directTo.length-1].id].returnedData = chunk.returnData
        actuator.chunks[chunk.directTo[chunk.directTo.length-1].id].state = 'running'
      }
    }
    if (chunk.id === 'main') {
      actuator.returnData = chunk.returnData
    }
    delete actuator.chunks[chunk.id]
    actuator.executiveData.tasks = arrangeTasks(actuator.settings.cps, actuator.chunks)
    return
  }
  if (complexType.type === 'string') chunk.returnData = { type: 'string', value: complexType.value }
  if (complexType.type === 'number') chunk.returnData = { type: 'number', value: complexType.value }
  if (complexType.type === 'boolean') chunk.returnData = { type: 'boolean', value: complexType.value }
  if (complexType.type === 'operators') if (executeOperators(chunk, complexType)) return
  if (complexType.type === 'none') chunk.returnData = { type: 'none', value: '無' }
  if (complexType.type === 'nan') chunk.returnData = { type: 'nan', value: '非數' }
  if (complexType.type === 'builtInFunction') if (executeBuiltInFunction(chunk, complexType)) return
  if (complexType.type === 'container') {
    let container = getContainer(chunk.layer, complexType.value)
    if (container === undefined) {
      throwError(chunk, { error: true, content: `找不到 ${complexType.value}`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : '{執行器}', line: complexType.line }]})
    } else {
      chunk.returnData = container
    }
  }
  if (complexType.type === 'array') if (getArray(chunk, complexType)) return
  if (complexType.type === 'object') if (getObject(chunk, complexType)) return
  if (complexType.type === 'expressions') if (getExpressions(chunk, complexType)) return
  if (complexType.type === 'parameters') if (executeParameters(chunk, complexType)) return
  if (complexType.type === 'key') if (executeKey(chunk, complexType)) return
  if (complexType.type === 'index' && complexType.value.length > 0) if (executeIndex(chunk, complexType)) return
  chunk.executiveData.row++
}

//丟出錯誤
function throwError (chunk, errorData) {
  if (chunk.directTo === undefined) {
    sendMessage({ type: 'executionStop', data: errorData })
  } else {
    chunk.directTo.map((item) => errorData.path.push({ func: item.name, line: item.line }))
    sendMessage({ type: 'executionStop', data: errorData })
  }
  process.exit()
}