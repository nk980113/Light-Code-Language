import { sendMessage } from './Actuator.js'

//日誌
export default function log (content) {
  sendMessage({ type: 'log', content }, false)
}