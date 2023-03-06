module.exports = analysisExpressions

const checkSyntax = require('./CheckSyntax')

const expressionsOperators = ['+', '-', '*', '**', '/', '==', '>', '<', '>=', '<=']

//分析運算式
function analysisExpressions (complexTypes) {
  let complexTypes2 = []
  let state = {}
  for (let run = 0; run < complexTypes.length; run++) {
    if (state.nowType === undefined) {
      if (complexTypes[run].type === 'operators' && expressionsOperators.includes(complexTypes[run].value) && complexTypes2[complexTypes2.length-1] !== undefined) {
        let complexTypes3 = []
        for (let run2 = run; run2 < complexTypes.length; run2++) {
          if (complexTypes[run2].type !== 'newLine') complexTypes3.push(complexTypes[run2])
        }
        if (complexTypes3[1] === undefined || (complexTypes3[1].type === 'operators' && !expressionsOperators.includes(complexTypes3[1].value))) return { error: true, content: `必須為運算式 (多出運算符 ${complexTypes[run].value})`, start: complexTypes[run].start, end: complexTypes[run].end, path: [{ func: '{分析器}' }, { line: complexTypes[run].line }]}
        state = { nowType: 'expressions', value: [[], complexTypes[run], []], line: complexTypes[run].line, layer: complexTypes[run].layer }
        for (let run2 = run-1; run2 >= 0; run2--) {
          if (complexTypes2[run2].type === 'operators' && (complexTypes2[run2].value.includes('=') || complexTypes2[run2].value.includes('>') || complexTypes2[run2].value.includes('<'))) {
            break
          } else {
            state.start = complexTypes2[run2].start
            if (complexTypes2[run2].type !== 'newLine') {
              if (complexTypes2[run2].type === 'operators') {
                state.value.splice(0, 0, complexTypes2[run2])
                state.value.splice(0, 0, [])
              }
              state.value[0].splice(0, 0, complexTypes2[run2])
            }
            complexTypes2.splice(run2, 1)
            run2--
          }
        }
      } else {
        complexTypes2.push(complexTypes[run])
      }
    } else {
      if (state.nowType === 'expressions') {
        if ((complexTypes[run].type !== 'newLine' && !Array.isArray(checkSyntax(state.value[state.value.length-1].concat(complexTypes[run])))) || (complexTypes[run].type === 'operators' && !expressionsOperators.includes(complexTypes[run].value))) {
          complexTypes2.push({ type: 'expressions', value: state.value, line: state.line, layer: state.layer, start: state.start, end: complexTypes[run].end })
          state = {}
          run--
        } else {
          if (complexTypes[run].type === 'operators') {
            state.value.push(complexTypes[run])
            state.value.push([])
          } else {
            if (complexTypes[run].type !== 'newLine') state.value[state.value.length-1].push(complexTypes[run])
          }
        }
      }
    }
  }
  if (state.nowType !== undefined) complexTypes2.push({ type: state.nowType, value: state.value, line: state.line, layer: state.layer, start: state.start, end: complexTypes[complexTypes.length-1].end })
  return complexTypes2
}