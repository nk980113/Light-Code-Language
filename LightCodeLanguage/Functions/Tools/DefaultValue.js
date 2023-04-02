export default function defaultValue (defaultValue_, newValue) {
  if (newValue === undefined) {
    return defaultValue_
  } else {
    let allKey = Object.keys(defaultValue_)
    for (let run = 0; run < allKey.length; run++) {
      if (typeof defaultValue_[allKey[run]] === 'object') {
        newValue[allKey[run]] = defaultValue_(defaultValue_[allKey[run]], newValue[allKey[run]])
      } else if (newValue[allKey[run]] === undefined) {
        newValue[allKey[run]] = defaultValue_[allKey[run]]
      }
    }
    return newValue
  }
}