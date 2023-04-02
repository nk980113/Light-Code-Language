import getVariableSize from '../../Tools/GetVariableSize.js'

import { actuator, sendMessage } from './Actuator.js'
import actuatorLog from './ActuatorLog.js'
import log from './Log.js'

//取得數字
function getNumber (number) {
  if (number >= 1000000000) {
    return `${Math.round((number/1000000000)*100)/100} GB`
  } else if (number >= 1000000) {
    return `${Math.round((number/1000000)*100)/100} MB`
  } else if (number >= 1000) {
    return `${Math.round((number/1000)*100)/100} KB`
  } else {
    return `${number} Bytes`
  }
}

//檢查記憶體
export default function checkVMemory () {
  let actuatorSize = getVariableSize(actuator)
  if (actuatorSize > actuator.settings.vMemCanUsed) {
    let settingsSize = getVariableSize('settings')+getVariableSize(actuator.settings)
    let executiveDataSize = (getVariableSize('id')+getVariableSize(actuator.id))+(getVariableSize('code')+getVariableSize(actuator.code))+(getVariableSize('executiveData')+getVariableSize(actuator.executiveData))+(getVariableSize('returnData')+getVariableSize(actuator.returnData))
    let chunksSize = getVariableSize('chunks')
    let chunksSize2 = []
    let allKey = Object.keys(actuator.chunks)
    allKey.map((item) => {
      let size = getVariableSize(item)+getVariableSize(actuator.chunks[item])
      chunksSize += size
      chunksSize2.push({ id: item, size })
    })
    let string = `錯誤: 使用的虛擬憶體超出上限 (${getNumber(actuatorSize)} / ${getNumber(actuator.settings.vMemCanUsed)})\n\n虛擬記憶體使用狀態:\n｜執行器: ${getNumber(actuatorSize)}\n｜｜設定資料: ${getNumber(settingsSize)} (${Math.round((100/actuatorSize)*settingsSize)}%)\n｜｜執行資料: ${getNumber(executiveDataSize)} (${Math.round((100/actuatorSize)*executiveDataSize)}%)\n｜｜區塊: ${getNumber(chunksSize)} (${Math.round((100/actuatorSize)*chunksSize)}%)\n｜｜｜`
    chunksSize2 = chunksSize2.sort((a, b) => {return b.size - a.size})
    for (let run = 0; run < 5 && run < chunksSize2.length; run++) {
      let directToData = actuator.chunks[chunksSize2[run].id].directTo
      let directTo = (actuator.chunks[chunksSize2[run].id].directTo === undefined) ? '無(執行器呼叫)' : `第 ${directToData[directToData.length-1].line} 行 (${directToData[directToData.length-1].name})`
      let chunk = actuator.chunks[chunksSize2[run].id]
      let chunkExecutiveDataSize = (getVariableSize('id')+(getVariableSize(chunk.id)*2))+
      (getVariableSize('name')+getVariableSize(chunk.name))+(getVariableSize('type')+getVariableSize(chunk.type))+(getVariableSize('layer')+getVariableSize(chunk.layer))+(getVariableSize('state')+getVariableSize(chunk.state))+(getVariableSize('executiveData')+getVariableSize(chunk.executiveData))+(getVariableSize('directTo')+getVariableSize(chunk.directTo))+(getVariableSize('returnedData')+getVariableSize(chunk.returnedData))+(getVariableSize('returnData')+getVariableSize(chunk.returnData))
      let complexTypesSize = getVariableSize('complexTypes')+getVariableSize(chunk.complexTypes)
      let containersSize = getVariableSize('containers')
      let containersSize2 = []
      allKey = Object.keys(actuator.chunks[chunksSize2[run].id].containers)
      allKey.map((item) => {
        let size = getVariableSize(item)+getVariableSize(actuator.chunks[chunksSize2[run].id].containers[item])
        containersSize+=size
        containersSize2.push({ name: item, size })
      })
      string+=`\n｜｜｜${actuator.chunks[chunksSize2[run].id].name}(${chunksSize2[run].id}): ${getNumber(chunksSize2[run].size)}\n｜｜｜｜呼叫此區塊的位置: ${directTo}\n｜｜｜｜執行資料: ${getNumber(chunkExecutiveDataSize)} (${Math.round((100/chunksSize2[run].size)*chunkExecutiveDataSize)}%)\n｜｜｜｜代碼片段: ${getNumber(complexTypesSize)} (${Math.round((100/chunksSize2[run].size)*complexTypesSize)}%)\n｜｜｜｜容器: ${getNumber(containersSize)} (${Math.round((100/chunksSize2[run].size)*containersSize)}%)`
      for (let run2 = 0; run2 < containersSize2.length; run2++) {
        string+=`\n｜｜｜｜｜${containersSize2[run].name}: ${getNumber(containersSize2[run].size)}`
      }
      if (run+1 < 5 && run+1 < chunksSize2.length) string+='\n｜｜｜'
    }
    log(string)
    actuatorLog('complete', '以停止執行')
    sendMessage({ type: 'executionStop', data: { error: 'vMemMotEnough' } })
    process.exit()
  }
}