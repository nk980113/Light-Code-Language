import { sendMessage } from './Actuator.js'

//執行器日誌
export default async function actuatorLog (logType, content) {
  sendMessage({ type: 'actuatorLog', logType, content }, false)
}