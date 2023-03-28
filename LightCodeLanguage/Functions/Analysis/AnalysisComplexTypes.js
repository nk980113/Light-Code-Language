module.exports = analysisComplexTypes

const checkSyntax = require('./CheckSyntax')
const analysisExpressions = require('./AnalysisExpressions')

//分析複雜類型
function analysisComplexTypes (simpleTypes) {
  if (simpleTypes.length < 1) return []
  let complexTypes = []
  let state = {}
  for (let run = 0; run < simpleTypes.length; run++) {
    if (state.nowType === undefined) {
      if (simpleTypes[run].type === '[') {
        if (simpleTypes[run-1] !== undefined && (simpleTypes[run-1].type === 'container' || complexTypes[complexTypes.length-1].type === 'key' || complexTypes[complexTypes.length-1].type === 'index')) {
          state = { nowType: 'index', value: [], line: simpleTypes[run].line, layer: simpleTypes[run].layer, start: simpleTypes[run].start }
        } else {
          state = { nowType: 'array', value: [], line: simpleTypes[run].line, layer: simpleTypes[run].layer, start: simpleTypes[run].start }
        }
      } else if (simpleTypes[run].type === '{') {
        if (complexTypes[complexTypes.length-1] !== undefined && complexTypes[complexTypes.length-1].type === 'parameters') {
          state = { nowType: 'chunk', value: [], line: simpleTypes[run].line, layer: simpleTypes[run].layer, start: simpleTypes[run].start }
        } else {
          state = { nowType: 'object', value: [], line: simpleTypes[run].line, layer: simpleTypes[run].layer, start: simpleTypes[run].start }
        }
      } else if (simpleTypes[run].type === 'operators' && (simpleTypes[run-1] === undefined) && (simpleTypes[run].value !== '=' && simpleTypes[run].value !== '++' && simpleTypes[run].value !== '--' && simpleTypes[run].value !== '**' && simpleTypes[run].value !== '+=' && simpleTypes[run].value !== '-=' && simpleTypes[run].value !== '*=' && simpleTypes[run].value !== '/=') && !simpleTypes[run].value.includes('*') && !simpleTypes[run].value.includes('/') && (simpleTypes[run-1] !== undefined && simpleTypes[run-1].type !== 'newLine') && (simpleTypes[run].value === '+' || simpleTypes[run].value === '-' || simpleTypes[run].value === '*' || simpleTypes[run].value === '/' || simpleTypes[run].value.includes('>') || simpleTypes[run].value.includes('<'))) {
        state = { nowType: 'expressions', value: [], line: simpleTypes[run].line, layer: simpleTypes[run].layer }
        for (let run2 = run-1; run2 >= 0; run2--) {
          if (complexTypes[run2].type === 'operators' && (complexTypes[run2].value.includes('=') || complexTypes[run2].value.includes('>') || complexTypes[run2].value.includes('<'))) {
            break
          } else {
            state.start = complexTypes[run2].start
            state.value.splice(0, 0, complexTypes[run2])
            complexTypes.splice(run2, 1)
            run2--
          }
        }
        state.value.push(simpleTypes[run])
      } else if (simpleTypes[run].type === '(') {
        state = { nowType: 'parameters', value: [], line: simpleTypes[run].line, layer: simpleTypes[run].layer, start: simpleTypes[run].start }
      } else {
        complexTypes.push(simpleTypes[run])
      }
    } else if (state.nowType === 'array' ) {
      if (simpleTypes[run].type === ']' && simpleTypes[run].layer === state.layer) {
        if (state.value[state.value.length-1] !== undefined && state.value[state.value.length-1].type === ',') return { error: true, content: `陣列尾端多出了一個 ,`, path: [{ func: '{分析器}' }, { line: state.value[state.value.length-1].line }]}
        let items = []
        let chunk = []
        for (let run2 = 0; run2 <= state.value.length; run2++) {
          if (state.value[run2] === undefined || (state.value[run2].type === ',' && state.value[run2].layer === simpleTypes[run].layer+1)) {
            let data = analysisComplexTypes(chunk)
            if (!Array.isArray(data)) return data
            data = checkSyntax(data)
            if (!Array.isArray(data)) {
              if (data.type === 'extraSymbol') return { error: true, content: `在陣列的第 ${items.length} 項多出了一個符號 ${data.symbol}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              else if (data.type === 'mustBeExpressions') return { error: true, content: `陣列的第 ${items.length} 項必須為運算式 (多出運算符 ${data.operators})`, path: [{ func: '{分析器}' }, { line: data.line }]}
              else if (data.type === 'extraOperators') return { error: true, content: `在陣列的第 ${items.length} 項多出了一個運算符 ${data.operators}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              else if (data.type === 'builtInFunction') return { error: true, content: `<內建功能> ${data.functionName} 的後面只能為一個 ${data.mustBe.join(' 或 ')}`, path: [{ func: '{分析器}' }, { line: data.line }] }
              else if (data.type === 'builtInFunctionNextMustBe') return { error: true, content: `<內建功能> ${data.functionName} 的後面必須為 ${data.mustBe}`, path: [{ func: '{分析器}' }, { line: data.line }] }
              else if (data.type === 'extraBuiltInFunction') return { error: true, content: `在陣列的第 ${items.length} 項多出了一個 <內建功能> ${data.builtInFunction}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              return { error: true, content: `在陣列的第 ${items.length} 項中少了一個 ,`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
            }
            items.push(checkSyntax(analysisComplexTypes(chunk)))
            chunk = []
          } else {
            chunk.push(state.value[run2])
          }
        }
        complexTypes.push({ type: 'array', value: items, line: state.line, layer: state.layer, start: state.start, end: simpleTypes[run].end })
        state = {}
      } else {
        if (simpleTypes[run].type !== 'newLine') state.value.push(simpleTypes[run])
      }
    } else if (state.nowType === 'chunk') {
      if (simpleTypes[run].type === '}' && simpleTypes[run].layer === state.layer) {
        let data = analysisComplexTypes(state.value)
        if (!Array.isArray(data)) return data
        let chunk = []
        for (let run = 0; run <= data.length; run++) {
          if ((data[run] === undefined || data[run].type === 'newLine') && chunk.length > 0) {
            const data = checkSyntax(chunk)
            if (!Array.isArray(data)) {
              if (data.type === 'extraSymbol') return { error: true, content: `多出符號 ${data.symbol}`, path: [{ func: '{分析器}' }, { line: data.line }]}
              else if (data.type === 'mustBeExpressions') return { error: true, content: `必須為運算式 (多出運算符 ${data.operators})`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              else if (data.type === 'extraOperators') return { error: true, content: `多出運算符 ${data.operators}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              else if (data.type === 'builtInFunction') return { error: true, content: `<內建功能> ${data.functionName} 的後面只能為一個 ${data.mustBe.join(' 或 ')}`, path: [{ func: '{分析器}' }, { line: data.line }] }
              else if (data.type === 'builtInFunctionNextMustBe') return { error: true, content: `<內建功能> ${data.functionName} 的後面必須為 ${data.mustBe}`, path: [{ func: '{分析器}' }, { line: data.line }] }
              else if (data.type === 'extraBuiltInFunction') return { error: true, content: `多出了一個 <內建功能> ${data.builtInFunction}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              return { error: true, content: `語法錯誤 (<${data.typeName}> 的後面不能為 <${data.typeName2}>)`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}  
            }
            chunk = []
          } else {
            if (data[run] !== undefined && data[run].type !== 'newLine') chunk.push(data[run])
          }
        }
        complexTypes.push({ type: 'chunk', value: data, line: state.line, layer: state.layer, start: state.start, end: simpleTypes[run].end })
        state = {}
      } else {
        state.value.push(simpleTypes[run])
      }
    } else if (state.nowType === 'object') {
      if (simpleTypes[run].type === '}' && simpleTypes[run].layer === state.layer) {
        let object = {}
        let chunk = []
        let key
        let value = []
        if (state.value.length > 0) {
          for (let run2 = 0; run2 <= state.value.length; run2++) {
            if (state.value[run2] === undefined || (state.value[run2].type === ',' && state.value[run2].layer === simpleTypes[run].layer+1)) {
              if (key === undefined) {
                if (chunk.length > 1 || (chunk[0].type !== 'string' && chunk[0].type !== 'container')) return { error: true, content: `物件的鑰必須為一個[容器名稱]或<字串>`, path: [{ func: '{分析器}' }, { line: chunk[0].line }]} 
                if (chunk[0].type === 'builtInFunction' && chunk[0].value === '唯讀') object[chunk[1].value] = { type: 'none', value: '無', mode: 'readOnly' }
                else object[chunk[0].value] = { type: 'none', value: '無', mode: 'normal' }
              } else {
                let data = analysisComplexTypes(value)
                if (!Array.isArray(data)) return data
                data = checkSyntax(data)
                if (!Array.isArray(data)) {
                  if (data.type === 'extraSymbol') return { error: true, content: `物件的鑰 ${key.value} 的值多出了一個 ${data.symbol}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                  else if (data.type === 'mustBeExpressions') return { error: true, content: `物件的鑰 ${key.value} 的值必須為運算式 (多出運算符 ${data.operators})`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                  else if (data.type === 'extraOperators') return { error: true, content: `物件的鑰 ${key.value} 的值多出了一個運算符 ${data.operators}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                  else if (data.type === 'builtInFunction') return { error: true, content: `<內建功能> ${data.functionName} 的後面只能為一個 ${data.mustBe.join(' 或 ')}`, path: [{ func: '{分析器}' }, { line: data.line }] }
                  else if (data.type === 'builtInFunctionNextMustBe') return { error: true, content: `<內建功能> ${data.functionName} 的後面必須為 ${data.mustBe}`, path: [{ func: '{分析器}' }, { line: data.line }] }
                  else if (data.type === 'extraBuiltInFunction') return { error: true, content: `物件的鑰 ${key.value} 的值多出了一個 <內建功能> ${data.builtInFunction}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                  else if (data.typeName2 === '字串' || data.typeName2 === '容器') return { error: true, content: `物件的鑰 ${key.value} 的值缺少一個 ,`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                  return { error: true, content: `物件的鑰 ${key.value} 的值存在語法錯誤 (<${data.typeName}> 的後面不能為 <${data.typeName2}>)`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
                }
                if (chunk[0].type === 'builtInFunction' && chunk[0].value === '唯讀') object[chunk[1].value] = Object.assign(data, { mode: 'readOnly' })
                else object[chunk[0].value] = Object.assign(data, { mode: 'normal' })
              }
              chunk = []
              key = undefined
              value = []
            } else {
              if (state.value[run2].type === ':' && state.value[run2].layer ===  simpleTypes[run].layer+1 && key === undefined) {
                if (chunk.length < 1) return { error: true, content: `物件缺少一個鑰`, start: state.value[run2].start, end: state.value[run2].end, path: [{ func: '{分析器}' }, { line: state.value[run2].line }]} 
                if (chunk.length === 1) {
                  if (chunk[0].type !== 'string' && chunk[0].type !== 'container') return { error: true, content: `物件的鑰必須為一個 [容器名稱] 或 <字串>`, start: chunk[0].start, end: chunk[chunk.length-1].end, path: [{ func: '{分析器}' }, { line: chunk[0].line }]} 
                } else if (chunk.length === 2) {
                  if (chunk[0].type !== 'builtInFunction' || chunk[0].value !== '唯讀') return { error: true, content: `物件的鑰前只能為一個 <內建功能> (必須為 唯讀 <鑰>:<值> 或 唯讀 <鑰>)`, start: chunk[0].start, end: chunk[chunk.length-1].end, path: [{ func: '{分析器}' }, { line: chunk[0].line }]}  
                } else if (chunk.length > 2) {
                  if (chunk[0].type !== 'string' && chunk[0].type !== 'container') return { error: true, content: `物件的鑰必須為一個 [容器名稱] 或 <字串>`, start: chunk[0].start, end: chunk[chunk.length-1].end, path: [{ func: '{分析器}' }, { line: chunk[0].line }]} 
                }
                if (state.value[run2+1] === undefined) return { error: true, content: `物件的鑰 ${chunk[0].value} 缺少值 (必須為 <鑰>:<值> 或 <鑰>)`, start: state.value[run2].start, end: state.value[run2].end, path: [{ func: '{分析器}' }, { line: chunk[0].line }]} 
                key = chunk[0]
              } else if (key !== undefined) {
                value.push(state.value[run2])
              }
              chunk.push(state.value[run2])
            }
          }
        }
        complexTypes.push({ type: 'object', value: object, line: state.line, layer: state.layer, start: state.start, end: simpleTypes[run].end })
        state = {}
      } else {
        if (simpleTypes[run].type !== 'newLine') state.value.push(simpleTypes[run])
      }
    } else if (state.nowType === 'parameters') {
      if (simpleTypes[run].type === ')' && simpleTypes[run].layer === state.layer) {
        if (state.value[state.value.length-1] !== undefined && state.value[state.value.length-1].type === ',') return { error: true, content: `參數列尾端多出了一個 ,`, path: [{ func: '{分析器}' }, { line: state.value[state.value.length-1].line }]}
        let items = []
        let chunk = []
        for (let run2 = 0; run2 <= state.value.length; run2++) {
          if (state.value[run2] === undefined || (state.value[run2].type === ',' && state.value[run2].layer === simpleTypes[run].layer+1)) {
            let data = analysisComplexTypes(chunk)
            if (!Array.isArray(data)) return data
            data = checkSyntax(data)
            if (!Array.isArray(data)) {
              if (data.type === 'extraSymbol') return { error: true, content: `在參數列的第 ${items.length} 項多出了一個符號 ${data.symbol}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              if (data.type === 'mustBeExpressions') return { error: true, content: `參數列的第 ${items.length} 項必須為運算式 (多出運算符 ${data.operators})`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              if (data.type === 'extraOperators') return { error: true, content: `在參數列的第 ${items.length} 項多出了一個運算符 ${data.operators}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              if (data.type === 'builtInFunction') return { error: true, content: `<內建功能> ${data.functionName} 的後面只能為一個 ${data.mustBe.join(' 或 ')}`, path: [{ func: '{分析器}' }, { line: data.line }] }
              if (data.type === 'builtInFunctionNextMustBe') return { error: true, content: `<內建功能> ${data.functionName} 的後面必須為 ${data.mustBe}`, path: [{ func: '{分析器}' }, { line: data.line }] }
              if (data.type === 'extraBuiltInFunction') return { error: true, content: `在參數列的第 ${items.length} 項多出了一個 <內建功能> ${data.builtInFunction}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              return { error: true, content: `在參數列的第 ${items.length} 項中少了一個 ,`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
            }
            items.push(checkSyntax(analysisComplexTypes(chunk)))
            chunk = []
          } else {
            chunk.push(state.value[run2])
          }
        }
        complexTypes.push({ type: 'parameters', value: items, line: state.line, layer: state.layer, start: state.start, end: simpleTypes[run].end })
        state = {}
      } else {
        if (simpleTypes[run].type !== 'newLine') state.value.push(simpleTypes[run])
      }
    } else if (state.nowType === 'index') {
      if (simpleTypes[run].type === ']' && simpleTypes[run].layer === state.layer) {
        if (state.value[state.value.length-1] !== undefined && state.value[state.value.length-1].type === ',') return { error: true, content: `陣列尾端多出了一個 ,`, path: [{ func: '{分析器}' }, { line: state.value[state.value.length-1].line }]}
        let items = []
        let chunk = []
        for (let run2 = 0; run2 <= state.value.length; run2++) {
          if (state.value[run2] === undefined || (state.value[run2].type === ',' && state.value[run2].layer === simpleTypes[run].layer+1)) {
            let data = analysisComplexTypes(chunk)
            if (!Array.isArray(data)) return data
            data = checkSyntax(data)
            if (!Array.isArray(data)) {
              if (data.type === 'extraSymbol') return { error: true, content: `在索引列的第 ${items.length} 多出了一個符號 ${data.symbol}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              if (data.type === 'mustBeExpressions') return { error: true, content: `索引列的第 ${items.length} 項必須為運算式 (多出運算符 ${data.operators})`, path: [{ func: '{分析器}' }, { line: data.line }]}
              if (data.type === 'extraOperators') return { error: true, content: `在索引列的第 ${items.length} 多出了一個運算符 ${data.operators}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              if (data.type === 'builtInFunction') return { error: true, content: `<內建功能> ${data.functionName} 的後面只能為一個 ${data.mustBe.join(' 或 ')}`, path: [{ func: '{分析器}' }, { line: data.line }] }
              if (data.type === 'extraBuiltInFunction') return { error: true, content: `在索引列的第 ${items.length} 項多出了一個 <內建功能> ${data.builtInFunction}`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
              return { error: true, content: `在索引列的第 ${items.length} 項中少了一個 ,`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: data.line }]}
            }
            items.push(checkSyntax(analysisComplexTypes(chunk)))
            chunk = []
          } else {
            chunk.push(state.value[run2])
          }
        }
        complexTypes.push({ type: 'index', value: items, line: state.line, layer: state.layer, start: state.start, end: simpleTypes[run].end })
        state = {}
      } else {
        if (simpleTypes[run].type !== 'newLine') state.value.push(simpleTypes[run])
      }
    }
  }
  if (state.nowType === 'array') return { error: true, content: `陣列尾端缺少 ]`, start: data.start, end: data.end, path: [{ func: '{分析器}' }, { line: state.line }]}
  if (state.nowType === 'object') return { error: true, content: `物件尾端缺少 }`, path: [{ func: '{分析器}' }, { line: state.line }]}
  if (state.nowType === 'parameters') return { error: true, content: `參數列尾端缺少 )`, path: [{ func: '{分析器}' }, { line: state.line }]}
  if (state.nowType !== undefined) complexTypes.push({ type: state.nowType, value: state.value, line: state.line, layer: state.layer, start: state.start, end: simpleTypes[simpleTypes.length-1].end })
  return analysisExpressions(complexTypes)
}