class Actuator {
  #id
  constructor (code, settings) {
    this.#id = createActuator(code, settings)
  }
  get id () {
    return this.#id
  }

  //運行執行器
  async run () {
    return await runActuator(this.#id)
  }
  //停止
  async stop () {
    await stopActuator(this.#id)
  }
  //添加事件聆聽器
  addEventLisnter (name, callback) {
    checkValues({ name }, ['undefined', ['stateChange']])
    checkValues({ callback }, ['undefined', 'function'])
    if (actuators[this.#id].events[name] === undefined) actuators[this.#id].events[name] = {}
    let id = generateID(5, Object.keys(actuators[this.#id].events[name]))
    actuators[this.#id].events[name][id] = callback
    return { name, id }
  }
  //移除事件聆聽器
  removeEventLisnter (eventLisnter) {
    if (eventLisnter.name === undefined || eventLisnter.id === undefined) error('error', '參數 eventLisnter 必須為創建 eventLisnter 時返回的值')
    if (actuators[this.#id].events[eventLisnter.name] !== undefined && actuators[this.#id].events[eventLisnter.name][eventLisnter.id] !== undefined) delete actuators[this.#id].events[eventLisnter.name][eventLisnter.id]
  }
}

let JsInterface = class  {
  static export (object, ) {

  }
} 

module.exports = { Actuator }

const { error, checkValues } = require('./Functions/Tools/Error')
const generateID = require('./Functions/Tools/GenerateID')

const { actuators, createActuator, runActuator, stopActuator } = require('./Functions/Actuator/MainThread/ActuatorManager')