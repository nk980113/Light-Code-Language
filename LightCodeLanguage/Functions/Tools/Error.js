export { error, checkValues, checkObjectValues }

//報錯
function error (type, content) {
  switch (type) {
    case 'error': 
      throw new Error(`Light Code Language: ${content}`)
    case 'MP':
      error('error', `參數 ${content} 為必要參數`)
    case 'PMBS':
      error('error', `參數 ${content} 必須為一個字串`)
    case 'PMBN':
      error('error', `參數 ${content} 必須為一個數字`)
    case 'PMBB':
      error('error', `參數 ${content} 必須為一個布林值`)
    case 'PMBA':
      error('error', `參數 ${content} 必須為一個陣列`)
    case 'PMBO':
      error('error', `參數 ${content} 必須為一個物件`)
    case 'PMBF':
      error('error', `參數 ${content} 必須為一個函數`)
    case 'PMB':
      error('error', `參數 ${content[0]} 必須為 ${content[1]}`)
    case '!PMBS':
      error('error', `參數 ${content} 必須為一個字串 (如果有提供)`)
    case '!PMBN':
      error('error', `參數 ${content} 必須為一個數字 (如果有提供)`)
    case '!PMBB':
      error('error', `參數 ${content} 必須為一個布林值 (如果有提供)`)
    case '!PMBA':
      error('error', `參數 ${content} 必須為一個陣列 (如果有提供)`)
    case '!PMBO':
      error('error', `參數 ${content} 必須為一個物件 v`)
    case '!PMBF':
      error('error', `參數 ${content} 必須為一個函數 (如果有提供)`)
    case '!PMB':
      error('error', `參數 ${content[0]} 必須為 ${content[1]} (如果有提供)`)
    case 'OMV':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 為必要參數`)
    case 'OVMBS':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個字串`)
    case 'OVMBN':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個數字`)
    case 'OVMBB':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個布林值`)
    case 'OVMBA':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個陣列`)
    case 'OVMBO':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個物件`)
    case 'OVMBF':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個函數`)
    case '!OVMBS':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個字串 (如果有提供)`)
    case '!OVMBN':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個數字 (如果有提供)`)
    case '!OVMBB':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個布林值 (如果有提供)`)
    case '!OVMBA':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個陣列 (如果有提供)`)
    case '!OVMBO':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個物件 (如果有提供)`)
    case '!OVMBF':
      error('error', `物件 ${content[0]} 的參數 ${content[1]} 必須為一個函數 (如果有提供)`)
  }
}

//檢查參數
function checkValues (values, options) {
  let mustBe
  options.map((item) => {
    if (Array.isArray(item)) mustBe = item
  })
  let allKey = Object.keys(values)
  if (options.includes('!undefined')) {
    allKey.map((item) => {
      if (values[item] !== undefined) {
        if (options.includes('string') && typeof values[item] !== 'string') {
          if (allKey.length === 1) {
            error('!PMBS', `${allKey.join(', ')}`)
          } else {
            error('!PMBS', `${allKey.join(', ')} (${item})`)
          }
        } else if (options.includes('number') && typeof values[item] !== 'number') {
          if (allKey.length === 1) {
            error('!PMBN', `${allKey.join(', ')}`)
          } else {
            error('!PMBN', `${allKey.join(', ')} (${item})`)
          }
        } else if (options.includes('boolean') && typeof values[item] !== 'boolean') {
          if (allKey.length === 1) {
            error('!PMBB', `${allKey.join(', ')}`)
          } else {
            error('!PMBB', `${allKey.join(', ')} (${item})`)
          }
        } else if (options.includes('array') && !Array.isArray(values[item])) {
          if (allKey.length === 1) {
            error('!PMBA', `${allKey.join(', ')}`)
          } else {
            error('!PMBA', `${allKey.join(', ')} (${item})`)
          }
        } else if (options.includes('object') && (typeof values[item] !== 'object' || Array.isArray(values[item]))) {
          if (allKey.length === 1) {
            error('!PMBO', `${allKey.join(', ')}`)
          } else {
            error('!PMBO', `${allKey.join(', ')} (${item})`)
          }
        } else if (options.includes('function') && typeof values[item] !== 'function') {
          if (allKey.length === 1) {
            error('!PMBF', `${allKey.join(', ')}`)
          } else {
            error('!PMBF', `${allKey.join(', ')} (${item})`)
          }
        } else if (mustBe !== undefined && !mustBe.includes(values[item])) {
          error('!PMB', [item, mustBe.join(', ')])
        }
      }
    })
  } else {
    allKey.map((item) => {
      if (options.includes('undefined') && values[item] === undefined) {
        if (allKey.length === 1) {
          error('PM', `${allKey.join(', ')}`)
        } else {
          error('PM', `${allKey.join(', ')} (${item})`)
        }
      } else if (options.includes('string') && typeof values[item] !== 'string') {
        if (allKey.length === 1) {
          error('PMBS', `${allKey.join(', ')}`)
        } else {
          error('PMBS', `${allKey.join(', ')} (${item})`)
        }
      } else if (options.includes('number') && typeof values[item] !== 'number') {
        if (allKey.length === 1) {
          error('PMBN', `${allKey.join(', ')}`)
        } else {
          error('PMBN', `${allKey.join(', ')} (${item})`)
        }
      } else if (options.includes('boolean') && typeof values[item] !== 'boolean') {
        if (allKey.length === 1) {
          error('PMBB', `${allKey.join(', ')}`)
        } else {
          error('PMBB', `${allKey.join(', ')} (${item})`)
        }
     } else if (options.includes('array') && !Array.isArray(values[item])) {
        if (allKey.length === 1) {
          error('PMBA', `${allKey.join(', ')}`)
       } else {
          error('PMBA', `${allKey.join(', ')} (${item})`)
        }
      } else if (options.includes('object') && (typeof values[item] !== 'object' || Array.isArray(values[item]))) {
        if (allKey.length === 1) {
          error('PMBO', `${allKey.join(', ')}`)
        } else {
          error('PMBO', `${allKey.join(', ')} (${item})`)
        }
      } else if (options.includes('function') && typeof values[item] !== 'function') {
        if (allKey.length === 1) {
          error('PMBF', `${allKey.join(', ')}`)
        } else {
          error('PMBF', `${allKey.join(', ')} (${item})`)
        }
      } else if (mustBe !== undefined && !mustBe.includes(values[item])) {
        error('PMB', [item, mustBe.join(', ')])
      }
    })
  }
}

//檢查物件的參數
function checkObjectValues (objectName, values, options) {
  let mustBe
  options.map((item) => {
    if (Array.isArray(item)) mustBe = item
  })
  let allKey = Object.keys(values)
  if (options.includes('!undefined')) {
    allKey.map((item) => {
      if (values[item] !== undefined) {
        if (options.includes('string') && typeof values[item] !== 'string') {
          if (allKey.length === 1) {
            error('!OVMBS', [objectName, `${allKey.join(', ')}`])
          } else {
            error('!OVMBS', [objectName, `${allKey.join(', ')} (${item})`])
          }
        } else if (options.includes('number') && typeof values[item] !== 'number') {
          if (allKey.length === 1) {
            error('!OVMBN', [objectName, `${allKey.join(', ')}`])
          } else {
            error('!OVMBN', [objectName, `${allKey.join(', ')} (${item})`])
          }
        } else if (options.includes('boolean') && typeof values[item] !== 'boolean') {
          if (allKey.length === 1) {
            error('!OVMBB', [objectName, `${allKey.join(', ')}`])
          } else {
            error('!OVMBB', [objectName, `${allKey.join(', ')} (${item})`])
          }
        } else if (options.includes('array') && !Array.isArray(values[item])) {
          if (allKey.length === 1) {
            error('!OVMBA', [objectName, `${allKey.join(', ')}`])
          } else {
            error('!OVMBA', [objectName, `${allKey.join(', ')} (${item})`])
          }
        } else if (options.includes('object') && (typeof values[item] !== 'object' || Array.isArray(values[item]))) {
          if (allKey.length === 1) {
            error('!OVMBO', [objectName, `${allKey.join(', ')}`])
          } else {
            error('!OVMBO', [objectName, `${allKey.join(', ')} (${item})`])
          }
        } else if (options.includes('function') && typeof values[item] !== 'function') {
          if (allKey.length === 1) {
            error('!OVMBF', [objectName, `${allKey.join(', ')}`])
          } else {
            error('!OVMBF', [objectName, `${allKey.join(', ')} (${item})`])
          }
        } else if (mustBe !== undefined && !mustBe.includes(values[item])) {
          error('!OVMB', [objectName, item, mustBe.join(', ')])
        }
      }
    })
  } else {
    allKey.map((item) => {
      if (options.includes('undefined') && values[item] === undefined) {
        if (allKey.length === 1) {
          error('OMV', [objectName, `${allKey.join(', ')}`])
        } else {
          error('OMV', [objectName, `${allKey.join(', ')} (${item})`])
        }
      } else if (options.includes('string') && typeof values[item] !== 'string') {
        if (allKey.length === 1) {
          error('OVMBS', [objectName, `${allKey.join(', ')}`])
        } else {
          error('OVMBS', [objectName, `${allKey.join(', ')} (${item})`])
        }
      } else if (options.includes('number') && typeof values[item] !== 'number') {
        if (allKey.length === 1) {
          error('OVMBN', [objectName, `${allKey.join(', ')}`])
        } else {
          error('OVMBN', [objectName, `${allKey.join(', ')} (${item})`])
        }
      } else if (options.includes('boolean') && typeof values[item] !== 'boolean') {
        if (allKey.length === 1) {
          error('OVMBB', [objectName, `${allKey.join(', ')}`])
        } else {
          error('OVMBB', [objectName, `${allKey.join(', ')} (${item})`])
        }
      } else if (options.includes('array') && !Array.isArray(values[item])) {
        if (allKey.length === 1) {
          error('OVMBA', [objectName, `${allKey.join(', ')}`])
        } else {
          error('OVMBA', [objectName, `${allKey.join(', ')} (${item})`])
        }
      } else if (options.includes('object') && (typeof values[item] !== 'object' || Array.isArray(values[item]))) {
        if (allKey.length === 1) {
          error('OVMBO', [objectName, `${allKey.join(', ')}`])
        } else {
          error('OVMBO', [objectName, `${allKey.join(', ')} (${item})`])
        }
      } else if (options.includes('function') && typeof values[item] !== 'function') {
        if (allKey.length === 1) {
          error('OVMBF', [objectName, `${allKey.join(', ')}`])
        } else {
          error('OVMBF', [objectName, `${allKey.join(', ')} (${item})`])
        }
      } else if (mustBe !== undefined && !mustBe.includes(values[item])) {
        error('OVMB', [objectName, item, mustBe.join(', ')])
      }
    })
  }
}