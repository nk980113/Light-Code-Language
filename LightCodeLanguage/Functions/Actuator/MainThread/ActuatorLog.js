import { actuators } from './ActuatorManager.js'

//執行器日誌
export default function actuatorLog (id, type, content) {
  if (actuators[id].settings.actuatorLog) {
    let logContent
    if (type === 'running') logContent = `[運行]: ${content}`
    else if (type === 'complete') logContent = `[完成]: ${content}`
    else if (type === 'error') logContent = `[錯誤]: ${content}`
    else if (type === 'warn') logContent = `[警告]: ${content}`
    else if (type === 'none') logContent = content
    if (actuators[id].settings.logToConsole) console.log(logContent)
    if (actuators[id].settings.saveLog) actuators[id].log.push(logContent)
  }
}