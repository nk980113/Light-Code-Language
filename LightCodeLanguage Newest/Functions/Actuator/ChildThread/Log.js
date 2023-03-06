module.exports = log

const { sendMessage } = require('./Actuator')

//日誌
function log (content) {
  sendMessage({ type: 'log', content }, false)
}