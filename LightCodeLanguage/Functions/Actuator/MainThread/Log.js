import { actuators } from './ActuatorManager.js'

//日誌
export default function log (id, content) {
  if (actuators[id].settings.logToConsole) console.log(content)
  if (actuators[id].settings.saveLog) actuators[id].log.push(content)
}