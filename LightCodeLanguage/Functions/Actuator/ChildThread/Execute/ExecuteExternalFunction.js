module.exports = executeExternalFunction

//取得輸出的內容
function getLogContent (complexType) {
  if (complexType.type === 'string' || complexType.type === 'number' || complexType.type === 'boolean' || complexType.type === 'none' || complexType.type === 'nan') return complexType.value
  else if (complexType.type === 'builtInFunction') return `[內建功能 ${complexType.value}]`
  else if (complexType.type === 'array') {
    let array = complexType.value
    console.log(array)
    console.log(complexType)
  }
}

//執行外部函數
function executeExternalFunction (chunk, container, parameters) {
  if (container === '輸出') {
    console.log(parameters)
  } else {

  }
  console.log(container, parameters)
}