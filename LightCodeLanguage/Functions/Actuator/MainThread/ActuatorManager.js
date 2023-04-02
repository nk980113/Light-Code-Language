import { Worker } from 'node:worker_threads'
import fs from 'node:fs'
import path from 'node:path'

let actuators = {}

export { actuators, createActuator, runActuator, stopActuator }

import { error } from '../../Tools/Error.js'
import generateID from '../../Tools/GenerateID.js'
import getPath from '../../Tools/GetPath.js'
import __dirname from '../../Tools/DirName.js'
import defaultValue from '../../Tools/DefaultValue.js'
import getVariableSize from '../../Tools/GetVariableSize.js'

import actuatorLog from './ActuatorLog.js'
import logError from './LogError.js'
import log from './Log.js'
import { defaultSettings, checkSettings } from './ActuatorSettings.js'

//創建執行器
function createActuator (mainFilePath, settings) {
  if (!fs.existsSync(mainFilePath)) error('error', `找不到檔案 ${mainFilePath}`)
  if (path.extname(mainFilePath) !== '.lcl') error('error', `文件的副檔名必須為 .lcl`)
  let id = generateID(5, Object.keys(actuators))
  actuators[id] = {
    mainFilePath,
    state: 'idle',
    vMem: undefined,
    log: [],
    settings: checkSettings(defaultValue(defaultSettings, settings)),
    code: fs.readFileSync(mainFilePath, 'utf8'),
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
    if (actuators[id].state !== 'idle') error('error', `無法運行執行器 ${id} (通常是因為執行器正在分析, 執行, 停止) [執行器狀態: ${actuators[id].state}]`)
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
      actuators[id].worker = new Worker(getPath(__dirname, ['<', 'ChildThread', 'Actuator.js']), { workerData: { actuatorId: id, settings: actuators[id].settings, code: actuators[id].code, mainFilePath: actuators[id].mainFilePath }}) 
      actuators[id].worker.addListener('message', listenMessage)
    }
  })
}

//停止執行器
async function stopActuator (id) {
  if (actuators[id].state !== 'analyzing' &&actuators[id].state !== 'running') {
    error('error', `無法停止執行器 ${id} (通常是因為執行器運行) [執行器狀態: ${actuators[id].state}]`)
  } else {
    
  }
}