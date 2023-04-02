//取得變數的大小
export default function getVariableSize (data) {
  let bytes = 0
  if (typeof data === 'string') bytes+=Buffer.byteLength(data, 'utf8')
  if (typeof data === 'number') bytes+=8
  if (typeof data === 'boolean') bytes+=4
  if (Array.isArray(data)) {
    data.map((item) => bytes+=getVariableSize(item))
  } else if (typeof data === 'object') {
    let allKey = Object.keys(data)
    allKey.map((item) => {
      bytes+=getVariableSize(item)+getVariableSize(data[item])
    })
  }
  return bytes
}