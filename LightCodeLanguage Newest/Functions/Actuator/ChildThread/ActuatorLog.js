module.exports = actuatorLog

const { sendMessage } = require('./Actuator')

//執行器日誌
async function actuatorLog (logType, content) {
  sendMessage({ type: 'actuatorLog', logType, content }, false)
}