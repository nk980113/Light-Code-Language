module.exports = {
  defaultSettings: {
    //效能設定
    cpe: 100, //Chunk Per Execution
    interval: 1,
    maxChunks: Infinity,
    vMemCanUsed: Infinity, //Virtual Memory Can Used
    //輸出設定
    logToConsole: true,
    saveLog: false,
    actuatorLog: false,
    detailedError: false,
    //其他設定
    vDiskPath: ''
  },
  checkSettings
}

const { error, checkObjectValues } = require("../../Tools/Error")

//檢查設定
function checkSettings (settings) {
  checkObjectValues('settings', { cpe: settings.cpe, maxChunks: settings.maxChunks, interval: settings.interval, vMemCanUsed: settings.vMemCanUsed }, ['number'])
  if (settings.cpe < 1) error('error', `物件 settings 的參數 cpe 必須為 >= 1`)
  if (settings.cpe === Infinity) error('error', `物件 settings 的參數不能為 Infinity`)
  if (settings.interval < 0) error('error', `物件 settings 的參數 interval 必須為 >= 0`)
  if (settings.vMemCanUsed < 0) error('error', `物件 settings 的參數 vMemCanUsed 必須為 >= 0`)
  checkObjectValues('settings', { logToConsole: settings.logToConsole, saveLog: settings.saveLog, actuatorLog: settings.actuatorLog, detailedError: settings.detailedError }, ['boolean'])
  checkObjectValues('settings', { vDiskPath: settings.vDiskPath }, ['string'])
  return settings
}