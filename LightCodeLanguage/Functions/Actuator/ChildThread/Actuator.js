import { parentPort, workerData } from 'node:worker_threads'

let actuator = {
  id: workerData.actuatorId,
  settings: workerData.settings,
  code: workerData.code,
  mainFilePath: workerData.mainFilePath,
  chunks: {},
  executiveData: {
    tasks: [],
    nowTask: 0
  },
  returnData: undefined,
}

export { actuator, sendMessage, addAndRunChunk, stopActuator }

import generateID from '../../Tools/GenerateID.js'

import actuatorLog from './ActuatorLog.js'
import logError from './LogError.js'
import analysis from '../../Analysis/Analysis.js'
import { addTask, executeLoop } from './ExecuteLoop.js'
import checkVMemory from './VMemoryManager.js'
import { checkPlugins } from './Plugin.js'
import log from './Log.js'

let messages = {}
parentPort.addListener('message', (msg) => {
  if (msg.type === 'return' && messages[msg.messageId] !== undefined) {
    messages[msg.messageId](msg)
    delete messages[msg.messageId]
  }
})

//停止執行器
async function stopActuator () {
  await sendMessage({ type: 'event', name: 'stateChange', value: 'idle' })
  process.exit()
}

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
  await sendMessage({ type: 'event', name: 'stateChange', value: 'analyzing' })
  actuatorLog('running', `正在分析 (${actuator.code.length} 字)`)
  let startTime = performance.now()
  let complexTypes = analysis(actuator.code)
  if (Array.isArray(complexTypes)) {
    await actuatorLog('complete', `分析完成 (花費 ${Math.round(performance.now()-startTime)}ms)`)
    actuator.chunks.main = {
      id: 'main',
      name: '全局',
      type: 'chunk', //chunk, childChunk
      path: actuator.mainFilePath,
      layer: '0,0', //層, 編號
      state: 'running', //wait, waitAsync
      executiveData: {
        row: 0,
        skip: undefined,
        mode: undefined,
        data: {}
      },
      containers: {
        輸出: { type: 'externalFunction', value: '[外部函數: 輸出]', async: false }
      },
      complexTypes,
      directTo: undefined,
      returnedData: undefined,
      returnData: { type: 'none', value: '無' },
    }
    checkVMemory()
    actuatorLog('running', '正在檢查插件')
    actuatorLog('complete', `檢查完成 (插件: [${await checkPlugins(actuator.mainFilePath)}])`)
    await sendMessage({ type: 'event', name: 'stateChange', value: 'running' })
    executeLoop()
  } else {
    actuatorLog('error', `編譯時拋出錯誤 (花費 ${Math.round(performance.now()-startTime)}ms)`)
    logError(complexTypes)
    stopActuator()
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
  if (wait) upperChunk.state = `wait-${chunkId}`
  let directTo = []
  if (upperChunk.directTo !== undefined) upperChunk.directTo.map((item) => directTo.push(item))
  directTo.splice(0, 0, {id: upperChunk.id, name: upperChunk.name, line})
  if (directTo.length > actuator.settings.maxCallLength) {
    let string = `錯誤: 呼叫長度超出上限 (${directTo.length} / ${actuator.settings.maxCallLength})\n\n區塊資料:\n｜ID: ${upperChunk.id}\n｜名稱: ${upperChunk.name}\n｜呼叫路徑:\n｜｜\n`
    directTo.map((item) => {
      string+=`｜｜[ID: ${item.id} - 名稱: ${item.name}] 在地 ${item.line} 行\n`
    })
    log(string)
    actuatorLog('complete', '以停止執行')
    sendMessage({ type: 'executionStop', data: { error: 'vMemMotEnough' } })
    process.exit()
  }
  actuator.chunks[chunkId] = {
    id: chunkId,
    name,
    type,
    path: upperChunk.path,
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