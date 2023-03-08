module.exports = executeKey

//執行鑰
function executeKey (chunk, complexType) {
  if (chunk.returnData.type === 'object') {
    let allKey = complexType.value.split('.')
    let container2 = chunk.returnData.value[allKey[0]]
    for (let run = 1; run < allKey.length; run++) {
      if (container2 === undefined || container2.type !== 'object') throwError(chunk, { error: true, content: `無法從一個 <${(container2 === undefined) ? '無' : typesName[container2.type]}> 中使用 <鑰> 來讀取值`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
      container2 = container2.value[allKey[run]]
    }
    if (container2 === undefined) chunk.returnData = { type: 'none', value: '無', path: chunk.returnData.path.concat([{ key: complexType.value }])}
    else chunk.returnData = (chunk.returnData.container === undefined) ? container2 : Object.assign(container2, { container: chunk.returnData.container, path: chunk.returnData.path.concat([{ key: complexType.value }])})
  } else {
    throwError(chunk, { error: true, content: `無法從一個 <${typesName[chunk.returnData.type]}> 中使用 <鑰> 來讀取值`, start: complexType.start, end: complexType.end, path: [{ func: (chunk.name === '全局') ? undefined : chunk.name, line: complexType.line }]})
  }
}