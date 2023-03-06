module.exports = generateID

const letters = 'ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz12345678901234567890'

//取得隨機數
function getRandom (min,max) {
  return Math.floor(Math.random()*max)+min
}

//生成一串ID
function generateAnID (length) {
  let string = ''
  while (string.length < length) string += letters[getRandom(0, letters.length)]
  return string
}

//生成id
function generateID (length, allKey) {
  let string = generateAnID(length)
  while (allKey.includes(string)) string = generateAnID(length)
  return string
}