const operators = '+-*/><=或且'
import builtInFunctions from '../BuiltInFunctions.json' assert { type: 'json' }

//分析代碼成簡易類型
export default function analysisSimpleTypes (code) {
  let simpleTypes = []
  let state = {}
  let layer = 0
  let line = 1
  for (let run = 0; run < code.length; run++) {
    if ((code[run] === '\n' || code[run] === ';') && state.nowType !== 'string') {
      if (state.nowType !== undefined) simpleTypes.push({ type: state.nowType, value: state.value, line, layer, start: state.start, end: run })
      simpleTypes.push({ type: 'newLine', start: run, end: run })
      state = {}
      line++
    } else if (code[run] === ' ' && state.nowType !== 'string') {
      if (state.nowType !== undefined) simpleTypes.push({ type: state.nowType, value: state.value, line, layer, start: state.start, end: run })
      state = {}
    } else if ((code[run] === ',' || code[run] === ':') && state.nowType !== 'string') {
      if (state.nowType !== undefined) simpleTypes.push({ type: state.nowType, value: state.value, line, layer, start: state.start, end: run })
      state = {}
      simpleTypes.push({ type: code[run], line, layer, start: run, end: run })
    } else if ((code[run] === '{' || code[run] === '(' || code[run] === '[') && state.nowType !== 'string') {
      if (state.nowType !== undefined) simpleTypes.push({ type: state.nowType, value: state.value, line, layer, start: state.start, end: run })
      state = {}
      simpleTypes.push({ type: code[run], line, layer, start: run, end: run })
      layer++
    } else if ((code[run] === '}' || code[run] === ')' || code[run] === ']') && state.nowType !== 'string') {
      layer--
      if (state.nowType !== undefined) simpleTypes.push({ type: state.nowType, value: state.value, line, layer, start: state.start, end: run })
      state = {}
      simpleTypes.push({ type: code[run], line, layer, start: run, end: run })
    } else if (state.nowType === undefined) {
      if (builtInFunctions.includes(code.substring(run, run+4))) {
        simpleTypes.push({ type: 'builtInFunction', value: code.substring(run, run+4), line, layer, start: run, end: run+1 })
        run+=3
      } else if (builtInFunctions.includes(code.substring(run, run+3))) {
        simpleTypes.push({ type: 'builtInFunction', value: code.substring(run, run+3), line, layer, start: run, end: run+1 })
        run+=2
      } else if (builtInFunctions.includes(code.substring(run, run+2))) {
        simpleTypes.push({ type: 'builtInFunction', value: code.substring(run, run+2), line, layer, start: run, end: run+1 })
        run+=1
      } else if (builtInFunctions.includes(code[run])) {
        simpleTypes.push({ type: 'builtInFunction', value: code[run], line, layer, start: run, end: run+1 })
      } else if (code[run] === "'" || code[run] === '"') {
        state = { nowType: 'string', startLine: line, startLetter: code[run], value: '', start: run }
      } else if (+code[run] === +code[run]) {
        state = { nowType: 'number', value: code[run], start: run }
      } else if (code[run] === '是' || code[run] === '否') {
        simpleTypes.push({ type: 'boolean', value: code[run], line, layer, start: run, end: run })
      } else if (operators.includes(code[run])) {
        if (code.substring(run, run+2) === '==' || code.substring(run, run+2) === '>=' || code.substring(run, run+2) === '<=' ||  code.substring(run, run+2) === '++' ||  code.substring(run, run+2) === '--' || code.substring(run, run+2) === '+=' || code.substring(run, run+2) === '-=' || code.substring(run, run+2) === '*=' || code.substring(run, run+2) === '/=') {
          simpleTypes.push({ type: 'operators', value: code.substring(run, run+2), line, layer, start: run, end: run })
          run+=1
        } else if (code[run] === '=' || code[run] === '+' || code[run] === '-' || code[run] === '*' || code[run] === '/' || code[run] === '>' || code[run] === '<') {
          simpleTypes.push({ type: 'operators', value: code[run], line, layer, start: run, end: run })
        }
      } else if (code[run] === '無') {
        simpleTypes.push({ type: 'none', value: '無', line, layer, start: run, end: run })
      } else if (code[run] === '非' && code[run+1] === '數') {
        simpleTypes.push({ type: 'nan', value: '非數', line, layer, start: run, end: run+1 })
        run+=1
      } else if (code[run] === '.') {
        state = { nowType: 'key', value: '', start: run }
      } else {
        state = { nowType: 'container', value: code[run], start: run }
      }
    } else { 
      if (state.nowType === 'string') {
        if (code[run] === state.startLetter) {
          simpleTypes.push({ type: 'string', value: state.value, line: state.startLine, layer, start: state.start, end: run })
          state = {}
        } else {
          if (code[run] === '\n') line++
          state.value+=code[run]
        }
      } else if (state.nowType === 'number') {
        if (+`${state.value}${code[run]}` === +`${state.value}${code[run]}`) {
          state.value+=code[run]
        } else {
          simpleTypes.push({ type: 'number', value: state.value, line, layer, start: state.start, end: run-1 })
          state = {}
          run--
        }
      } else if (state.nowType === 'key') {
        if (code[run] === "'" || code[run] === '"') {
          simpleTypes.push({ type: 'key', value: state.value, line, layer, start: state.start, end: run-1 })
          run--
          state = { nowType: 'string', startLine: line, startLetter: code[run], value: '', start: run }
        } else {
          state.value+=code[run]
        }
      } else if (state.nowType === 'container') {
        if (code[run] === "'" || code[run] === '"') {
          simpleTypes.push({ type: 'container', value: state.value, line, layer, start: state.start, end: run-1 })
          run--
          state = { nowType: 'string', startLine: line, startLetter: code[run], value: '', start: run }
        } else if (operators.includes(code[run])) {
          simpleTypes.push({ type: 'container', value: state.value, line, layer, start: state.start, end: run-1 })
          state = {}
          run--
        } else if (code[run] === ".") {
          simpleTypes.push({ type: 'container', value: state.value, line, layer, start: state.start, end: run-1 })
          state = {}
          run--
        } else {
          state.value+=code[run]
        }
      }
    }
  }
  if (state.nowType === 'string') return { error: true, content: `字串尾端缺少 ${state.startLetter}`, start: state.start, end: code.length-1, path: [{ func: '{分析器}' }, { line: state.startLine }]}
  else if (state.nowType !== undefined) simpleTypes.push({ type: state.nowType, value: state.value, line, layer, start: state.start, end: code.length })
  return simpleTypes
}