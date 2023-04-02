const defaultSettings = {
   //效能設定
   cpe: 100, //Chunk Per Execution
   vMemCanUsed: Infinity, //Virtual Memory Can Used
   interval: 1,
   maxChunks: Infinity,
   maxCallLength: 100,
   //輸出設定
   logToConsole: true,
   saveLog: false,
   actuatorLog: false,
   detailedError: false,
   //其他設定
   vDiskPath: ''
}

export { defaultSettings, checkSettings }

import { error, checkObjectValues } from '../../Tools/Error.js'

//檢查設定
function checkSettings (settings) {
  checkObjectValues('settings', { cpe: settings.cpe, vMemCanUsed: settings.vMemCanUsed, interval: settings.interval, maxChunks: settings.maxChunks, maxCallLength: settings.maxCallLength }, ['number'])
  if (settings.cpe < 1) error('error', `物件 settings 的參數 cpe 必須為 >= 1`)
  if (settings.cpe === Infinity) error('error', `物件 settings 的參數不能為 Infinity`)
  if (settings.vMemCanUsed < 0) error('error', `物件 settings 的參數 vMemCanUsed 必須為 >= 0`)
  if (settings.interval < 0) error('error', `物件 settings 的參數 interval 必須為 >= 0`)
  if (settings.maxCallLength < 1) error('error', `物件 settings 的參數 maxCallLength 必須為 >= 1`)
  checkObjectValues('settings', { logToConsole: settings.logToConsole, saveLog: settings.saveLog, actuatorLog: settings.actuatorLog, detailedError: settings.detailedError }, ['boolean'])
  checkObjectValues('settings', { vDiskPath: settings.vDiskPath }, ['string'])
  return settings
}