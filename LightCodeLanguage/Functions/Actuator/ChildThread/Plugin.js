import fs from 'node:fs'

export { checkPlugins }

import getPath from '../../Tools/GetPath.js'

import actuatorLog from './ActuatorLog.js'
import { stopActuator } from './Actuator.js'
import log from './Log.js'

//資料的值的類型錯誤
function infoValueTypeWrong (name, valueName, type) {
  log(`錯誤:\n| 內容: 插件 ${name} 的資料 ${valueName} 的類型只能為一個 <${type}>`)
  stopActuator()
}

//檢查插件資料
async function checkPluginInfo (path, name) {
  if (fs.existsSync(getPath(path, ['info.json']))) {
    let info = (await import(getPath(path, ['info.json']), { assert: { type: 'json' }})).default
    if (typeof info.version !== 'string') infoValueTypeWrong(name, 'version', '字串')
    else if (typeof info.description !== 'string') infoValueTypeWrong(name, description, '字串')
    else if (info.type !== 'lcl' && info.type !== 'js') {
      log(`錯誤:\n| 內容: 插件 ${name} 的資料 ${valueName} 只能為 "lcl" 或 "js"`)
      stopActuator()
    } else if (typeof info.main !== 'string') infoValueTypeWrong(name, main, '字串')
    actuatorLog('complete', `插件 ${name} (${info.version}) 檢查完成`)
  } else {
    log(`錯誤:\n| 內容: 無法取得插件 ${name} 的資料 (缺少 info.json)`)
    stopActuator()
  }
}

//檢查插件
async function checkPlugins (path) {
  if (fs.existsSync(getPath(path, ['<', 'LCL-Plugins'])) && fs.statSync(getPath(path, ['<', 'LCL-Plugins'])).isDirectory()) {
    let folders = fs.readdirSync(getPath(path, ['<', 'LCL-Plugins']))
    for (let run = 0; run < folders.length; run++) await checkPluginInfo(getPath(path, ['<', 'LCL-Plugins', folders[run]]), folders[run])
    return folders
  } else {
    actuatorLog('complete', '沒有找到存放插件的資料夾 (./LCL-Plugins)')
    return []
  }
}