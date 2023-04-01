module.exports = executeExternalFunction

const log = require('../Log')

//取得輸出的內容
function getLogContent (complexType) {
  if (complexType.type === 'string' || complexType.type === 'number' || complexType.type === 'boolean' || complexType.type === 'none' || complexType.type === 'nan') return complexType.value
  else if (complexType.type === 'builtInFunction') return `[內建功能 ${complexType.value}]`
  else if (complexType.type === 'array') {
    let array = []
    complexType.value.map((item) => array.push(getLogContent(item)))
    return `[${array.join(', ')}]`
  } else if (complexType.type === 'object') {

  }
}

//執行外部函數
async function executeExternalFunction (chunk, container, parameters) {
  if (container.container === '輸出') {
    let content = []
    parameters.map((item) => content.push(getLogContent(item)))
    log(content.join(', '))
  } else {

  }
}