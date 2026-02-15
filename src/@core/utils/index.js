
export const isEmpty = value => {
  if (value === null || value === undefined || value === '')
    return true
  
  return !!(Array.isArray(value) && value.length === 0)
}


export const isNullOrUndefined = value => {
  return value === null || value === undefined
}


export const isEmptyArray = arr => {
  return Array.isArray(arr) && arr.length === 0
}


export const isObject = obj => obj !== null && !!obj && typeof obj === 'object' && !Array.isArray(obj)
export const isToday = date => {
  const today = new Date()
  
  return (
    
    date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
  
  )
}
//done