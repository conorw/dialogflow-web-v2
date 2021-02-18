/* eslint-disable no-param-reassign */

export const setCORSHeaders = (res: any) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res
}

export const json2table = (json: any, classes: string) => {
  const cols = Object.keys(json[0])

  let headerRow = ''
  let bodyRows = ''

  classes = classes || ''

  const capitalizeFirstLetter = (string: string) => {
    return (string.charAt(0).toUpperCase() + string.slice(1)).replace('_', ' ')
  }

  cols.forEach(col => {
    headerRow += `<th>${capitalizeFirstLetter(col)}</th>`
  })

  json.forEach((row: { [x: string]: any }) => {
    bodyRows += '<tr>'

    cols.forEach(colName => {
      bodyRows += `<td>${Array.isArray(row[colName]) ? row[colName].join('<br>') : row[colName]}</td>`
    })

    bodyRows += '</tr>'
  })

  return `<table class="${
    classes
  }"><thead><tr>${
    headerRow
  }</tr></thead><tbody>${
    bodyRows
  }</tbody></table>`
}