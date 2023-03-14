const { parentPort, workerData } = require('worker_threads')

let actuator = {
  id: workerData.actuatorId,
  settings: workerData.settings,
  code: workerData.code,
  chunks: {},
  executiveData: {
    tasks: [],
    nowTask: 0
  },
  returnData: undefined
}

module.exports = { actuator, sendMessage, addAndRunChunk }

const generateID = require('../../Tools/GenerateID')

const actuatorLog = require('./ActuatorLog')
const logError = require('./LogError')
const analysis = require('../../Analysis/Analysis')
const { addTask, executeLoop } = require('./ExecuteLoop')
const checkVMemory = require('./VMemoryManager')

let messages = {}
parentPort.addListener('message', (msg) => {
  if (msg.type === 'return' && messages[msg.messageId] !== undefined) {
    messages[msg.messageId](msg)
    delete messages[msg.messageId]
  }
})

//發送訊息
async function sendMessage (content, waitReturn) {
  return new Promise((resolve, reject) => {
    let id = generateID(5, Object.keys(messages))
    messages[id] = (msg) => {
      if (waitReturn === undefined || waitReturn === true) resolve(msg)
    }
    parentPort.postMessage(Object.assign(content, { actuatorId: actuator.id, messageId: id }))
  })
}

(async () => {
  await sendMessage({ type: 'event', name: 'stateChange', value: 'compiling' })
  actuatorLog('running', `正在編譯 (${actuator.code.length} 字)`)
  let startTime = performance.now()
  let complexTypes = analysis(actuator.code)
  if (Array.isArray(complexTypes)) {
    await actuatorLog('complete', `編譯完成 (花費 ${Math.round(performance.now()-startTime)}ms)`)
    actuator.chunks.main = {
      id: 'main',
      name: '全局',
      type: 'normal', //async
      layer: '0,0', //層, 編號
      state: 'running', //wait, waitAsync
      executiveData: {
        row: 0,
        skip: undefined,
        mode: undefined,
        data: {}
      },
      containers: {
        輸出: { type: 'function', value: { type: 'directTo', value: '{外部函數}' } }
      },
      complexTypes,
      directTo: undefined,
      returnedData: undefined,
      returnData: { type: 'none', value: '無' },
    }
    checkVMemory()
    executeLoop()
  } else {
    await sendMessage({ type: 'event', name: 'stateChange', value: 'idle' })
    actuatorLog('error', `編譯時拋出錯誤 (花費 ${Math.round(performance.now()-startTime)}ms)`)
    logError(complexTypes)
    process.exit()
  }
})()

//取得層
function getLayer (layer) {
  let allId = []
  let allKey = Object.keys(actuator.chunks)
  allKey.map((item) => {
    if (actuator.chunks[item].layer.split(',')[0] === layer) allId.push(+actuator.chunks[item].layer.split(',')[1])
  })
  let count = 0
  while (allId.includes(count)) count++
  return `${+layer+1},${count}`
}

//添加區塊
function addAndRunChunk (upperChunk, line, wait, complexTypes, name, type) {
  let chunkId = generateID(5, Object.keys(actuator.chunks))
  if (wait) upperChunk.state = (type === 'normal') ? `wait-${chunkId}` : `waitAsync-${chunkId}`
  let directTo = []
  if (upperChunk.directTo !== undefined) upperChunk.directTo.map((item) => directTo.push(item))
  directTo.push({id: upperChunk.id, name: upperChunk.name, line})
  if (directTo.length > 10) directTo.splice(0, 1)
  actuator.chunks[chunkId] = {
    id: chunkId,
    name,
    type,
    layer: getLayer(upperChunk.layer.split(',')[0]),
    state: 'running',
    executiveData: {
      row: 0,
      skip: undefined,
      mode: undefined,
      data: {}
    },
    containers: {},
    complexTypes,
    directTo,
    returnedData: undefined,
    returnData: { type: 'none', value: '無' },
  }
  addTask(chunkId)
  return actuator.chunks[chunkId]
}