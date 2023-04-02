import { actuator } from './Actuator.js'
import log from './Log.js'

//輸出錯誤
export default function logError (errorData) {
  let path = ''
  errorData.path.map((item, row) => {
    if (row === 0) path+=`${getPathText(item.func, item.line)}\n`
    else path+=`| | ${getPathText(item.func, item.line)}\n`
  })
  let start = errorData.start
  let end = errorData.end
  for (let run = start; run > 0; run--) {
    if (actuator.code[run] === '\n') break
    else start = run
  }
  if (actuator.code[start] === ' ') {
    for (let run = start; run < actuator.code[run].length; run++) {
      if (actuator.code[run] !== ' ') {
        start = run-1
        break
      }
    }
  }
  for (let run = end; run < errorData.end; run++) {
    if (actuator.code[run] === '\n') break
    else end = run
  }
  log(`錯誤:\n| 內容: ${errorData.content}\n| 位置: ${path}\n${actuator.code.substring(start, end)}\n\x1b[8m${actuator.code.substring(start, errorData.start)}\x1b[0m^`)
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