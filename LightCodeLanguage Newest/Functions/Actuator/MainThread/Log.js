module.exports = log

const { actuators } = require('./ActuatorManager')

//日誌
function log (id, content) {
  if (actuators[id].settings.logToConsole) console.log(content)
  if (actuators[id].settings.saveLog) actuators[id].log.push(content)
}