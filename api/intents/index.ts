/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { findAllIntents } from '../common/dialogflow'

const json2table = (json: any, classes: string) => {
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

    json.forEach(row => {
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
export default async (req: NowRequest, res: NowResponse) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    /* On GET request return the information about the agent */
    if (req.method == 'GET'){
        try {
            const intents = await findAllIntents('INTENT_VIEW_FULL')
            const intentList = []
            let phraseCount = 0
            let responseCount = 0
            // res.send(intents)
            intents.forEach(intent => {
                if (intent){
                    intent.forEach(t => {
                        const user_says = t.trainingPhrases.map(t => t.parts.map(r => r.text)).reduce((a, b) => a.concat(b), [])
                        phraseCount = phraseCount + user_says.length
                        const bot_says = t.messages.map(r => r.text.text).reduce((a, b) => a.concat(b), [])
                        responseCount = responseCount + bot_says.length
                        intentList.push({intent_name: t.displayName,
                            user_says,
                            bot_says
                        })
                    })
                }
            })
            const sorted = intentList.sort((a, b) => {
                return a.intent_name.localeCompare(b.intent_name)
            })
            const style = `<style>
            .tbl {
                font-family: Arial, Helvetica, sans-serif;
                border-collapse: collapse;
                width: 100%;
              }
              .tbl td, .tbl th {
                border: 1px solid #ddd;
                padding: 8px;
              }
              .tbl tr:nth-child(even){background-color: #f2f2f2;}
              .tbl tr:hover {background-color: #ddd;}
              .tbl th {
                padding-top: 12px;
                padding-bottom: 12px;
                text-align: left;
                background-color: #4CAF50;
                color: white;
              }
              </style>`
            const html = `<!DOCTYPE html><head>${style}<meta charset="UTF-8"></head><body>${json2table(sorted, 'tbl')}<br>
            Total Intents: <strong>${intentList.length}</strong><br>
            Training Phrases: <strong>${phraseCount}</strong><br>
            Training Responses: <strong>${responseCount}</strong><br>
            </body></html>`
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Content-Length': Buffer.byteLength(html),
                'Expires': new Date().toUTCString()
            })
            res.write(html)
        } catch (error){
            res.statusCode = 500
            res.send(error.message)
        }
    } else if (req.method == 'OPTIONS'){
        /* Pass pre-flight HTTP check */
        res.send(200)
    } else {
        /* Send 404 on undefined method */
        res.send(404)
    }
}
