import { actuators } from './ActuatorManager.js'
import log from './Log.js'

//輸出錯誤
export default function logError (id, errorData) {
  let path = ''
  errorData.path.map((item, row) => {
    if (row === 0) path+=`${getPathText(item.func, item.line)}\n`
    else path+=`| | ${getPathText(item.func, item.line)}\n`
  })
  let start = errorData.start
  let end = errorData.end
  for (let run = start; run >= errorData.start-10; run--) {
    if (actuators[id].code[run] === '\n') break
    else start = run
  }
  if (actuators[id].code[start] === ' ') {
    for (let run = start; run < errorData.start; run++) {
      if (actuators[id].code[run] !== ' ') {
        start = run
        break
      }
    }
  }
  for (let run = end; run < errorData.end+10; run++) {
    if (actuators[id].code[run] === '\n') break
    else end = run+1
  }
  log(id, `錯誤:\n| 內容: ${errorData.content}\n| 位置: ${path}\n${actuators[id].code.substring(start, end)}\n\x1b[8m${actuators[id].code.substring(start, errorData.start)}\x1b[0m^`)
}

//取得路徑文字
function getPathText (func, line) {
  if (func === undefined) return `在第 ${line} 行`
  if (line === undefined) return `在 ${func}`
  if (func === '全局') {
    if (line === undefined) return `在 全局`
    return `在第 ${line} 行\n`
  } else if (func.includes('{')) {
    return `在第 ${line} 行的 ${func}` 
  }
  return `在第 ${line} 行 (${func})`
}