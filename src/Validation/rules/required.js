export function required (val, args) {
  if (
    val === undefined ||
    val === null ||
    val === 'undefined' ||
    val === 'null'
  ) {
    return false
  }

  if (typeof val === 'string') {
    const tmp = val.replace(/\s/g, '')
    return tmp.length > 0
  }
  console.log('val', val)
  if (typeof val === 'object') {
    return val.length > 0
  }

  return true
}
