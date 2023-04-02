//取得路徑
export default function getPath (basePath, move) {
  let symbol
  if (process.platform === 'linux' || process.platform === 'darwin') symbol = '/'
  if (process.platform === 'win32') symbol = '\\\\'
  let analysis = basePath.split(symbol)
  move.map((item) => {
    if (item === '<') analysis.splice(analysis.length-1, 1)
    else analysis.push(item)
  })
  return analysis.join(symbol)
}