const { Worker } = require('worker_threads')

let actuators = {}

module.exports = { actuators, createActuator, runActuator, stopActuator }

const { error } = require('../../Tools/Error')
const generateID = require('../../Tools/GenerateID')
const getPath = require('../../Tools/Path')
const defaultValue = require('../../Tools/DefaultValue')
const getVariableSize = require('../../Tools/GetVariableSize')

const actuatorLog = require('./ActuatorLog')
const logError = require('./LogError')
const log = require('./Log')
const { defaultSettings, checkSettings } = require('./ActuatorSettings')

//創建執行器
function createActuator (code, settings) {
  let id = generateID(5, Object.keys(actuators))
  actuators[id] = {
    state: 'idle',
    vMem: undefined,
    log: [],
    settings: checkSettings(defaultValue(defaultSettings, settings)),
    code,
    worker: undefined,
    events: {},
    executionStopCallBack: undefined
  }
  return id
}

//接收訊息
function listenMessage (msg) {
  if (msg.type === 'executionStop') {
    actuators[msg.actuatorId].state = 'idle'
    actuators[msg.actuatorId].executionCompletedCallBack(msg.data)
  } else if (msg.type === 'event') {
    if (msg.name === 'stateChange') {
      actuators[msg.actuatorId].state = msg.value
    }
    actuators[msg.actuatorId].worker.postMessage({ type: 'return', messageId: msg.messageId })
  } else if (msg.type === 'actuatorLog') {
    actuatorLog(msg.actuatorId, msg.logType, msg.content)
  } else if (msg.type === 'log') {
    log(msg.actuatorId, msg.content)
  }
}

//運行執行器
async function runActuator (id) {
  return new Promise((resolve, reject) => {
    if (actuators[id].state !== 'idle') error('error', `無法運行執行器 ${id} (通常是因為執行器正在編譯, 執行, 停止) [執行器狀態: ${actuators[id].state}]`)
    if (getVariableSize(actuators[id].code) > actuators[id].settings.vMemCanUsed) {
      log(id, `代碼的大小超出記憶體的上限 (${Math.round((getVariableSize(actuators[id].code)/1000000)*100)/100} MB / ${Math.round((actuators[id].settings.vMemCanUsed/1000000)*100)/100} MB)`)
    } else {
      actuators[id].executionCompletedCallBack = (data) =>  {
        if (data.error === true) {
          actuatorLog(id, 'complete', '執行時出現錯誤')
          logError(id, data)
          resolve(undefined)
        } else {
          resolve(data)
        }
      }
      actuators[id].worker = new Worker(getPath(__dirname, ['<', 'ChildThread', 'Actuator.js']), { workerData: { actuatorId: id, settings: actuators[id].settings, code: actuators[id].code }}) 
      actuators[id].worker.addListener('message', listenMessage)
    }
  })
}

//停止執行器
async function stopActuator (id) {
  if (actuators[id].state !== 'analysis' &&actuators[id].state !== 'running') {
    error('error', `無法停止執行器 ${id} (通常是因為執行器運行) [執行器狀態: ${actuators[id].state}]`)
  } else {
    
  }
}