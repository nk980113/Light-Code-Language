import { actuator } from '../Actuator.js'

//取得區塊的容器
function getChunkContainer (chunkId, name) {
  if (actuator === undefined || actuator.chunks[chunkId].containers[name] === undefined) {
    return { type: 'none', value: '無' }
  } else {
    let container = actuator.chunks[allKey[run]].containers[name]
    if (container.type === 'directTo') {
      return getChunkContainer(container.chunkId, container.name)
    } else {
      return Object.assign(container, { container: name, path: [] })
    }
  }
}

//取得容器
export default function getContainer (layer, name) {
  let allKey = Object.keys(actuator.chunks)
  for (let run = 0; run < allKey.length; run++) {
    if ((actuator.chunks[allKey[run]].layer === layer) || (+actuator.chunks[allKey[run]].layer.split(',')[0] < +layer.split(',')[0])) {
      if (actuator.chunks[allKey[run]].containers[name] !== undefined) {
        let container = actuator.chunks[allKey[run]].containers[name]
        if (container.type === 'directTo' && container.value !== '') {
          return getChunkContainer(id, container.chunkId, container.name)
        } else {
          return Object.assign(container, { container: name, path: [], chunkId: allKey[run] })
        }
      }
    }
  }
}