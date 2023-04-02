import fs from 'node:fs'

export { checkPlugins }

import getPath from '../../Tools/GetPath.js'

import { stopActuator } from './Actuator.js'
import log from './Log.js'

//資料的值的類型錯誤
function infoValueTypeWrong (name, valueName, type) {
  log(`錯誤:\n| 內容: 插件 ${name} 的資料 ${valueName} 的類型只能為一個 <${type}>`)
  stopActuator()
}

//檢查插件資料
function checkPluginInfo (path, name) {
  if (fs.existsSync(getPath(path, ['info.json']))) {
    let info = require(getPath(path, ['info.json']))
    if (typeof info.version !== 'string') infoValueTypeWrong(name, 'version', '字串')
    else if (typeof info.description !== 'string') infoValueTypeWrong(name, description, '字串')
    else if (info.type !== 'lcl' && info.type !== 'js') {
      log(`錯誤:\n| 內容: 插件 ${name} 的資料 ${valueName} 只能為 "lcl" 或 "js"`)
      stopActuator()
    } else if (typeof info.main !== 'string') infoValueTypeWrong(name, main, '字串')
  } else {
    log(`錯誤:\n| 內容: 無法取得插件 ${name} 的資料 (缺少 info.json)`)
    stopActuator()
  }
}

//檢查插件
function checkPlugins (path) {
  if (fs.existsSync(getPath(path, ['<', 'LCL-Plugins'])) && fs.statSync(getPath(path, ['<', 'LCL-Plugins'])).isDirectory()) {
    let folders = fs.readdirSync(getPath(path, ['<', 'LCL-Plugins']))
    folders.map((item) => checkPluginInfo(getPath(path, ['<', 'LCL-Plugins', item]), item))
    return folders
  } else {
    return []
  }
}