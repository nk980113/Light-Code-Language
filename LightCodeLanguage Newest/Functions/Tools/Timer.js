module.exports = { addInterval, changeIntervalInterval,removeInterval }

const generateID = require('./GenerateID')

let timers = []

let interval

//開始Timer
function startTimer () {
  interval = setInterval(() => {
    let time = performance.now()
    timers.map((item, row) => {
      if (time-item.lastTimeSave >= item.ms) {
        item.callback()
        item.lastTimeSave = time
      }
    })
  }, 1)
}

//添加重複
function addInterval (ms, callback) {
  if (interval === undefined) startTimer()
  let allID = []
  timers.map((item) => allID.push(item.id))
  let id = generateID(5, allID)
  timers.push({
    id,
    ms,
    callback,
    lastTimeSave: performance.now()
  })
  return id
}

//改變重複的間隔
function changeIntervalInterval (id, interval) {
  for (let run = 0; run < timers.length; run++) {
    if (timers[run].id === id) {
      timers[run].interval = interval
      break
    }
  }
}

//移除重複
function removeInterval (id) {
  for (let run = 0; run < timers.length; run++) {
    if (timers[run].id === id) {
      timers.splice(run, 1)
      break
    }
  }
  if (timers.length < 1) {
    clearInterval(interval)
    interval = undefined
  }
}