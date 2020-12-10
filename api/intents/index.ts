/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { getCheatSheet, getProgress, saveProgress } from '../../common/airtable'
import { findAllIntents } from '../../common/dialogflow'
import { setCORSHeaders } from '../../common/utils'

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
    res = setCORSHeaders(res)
    /* On GET request return the information about the agent */
    if (req.method == 'GET'){
        try {
            const [intents, cheatsheet, progress] = await Promise.all([findAllIntents('INTENT_VIEW_FULL'),
                getCheatSheet(),
                getProgress(process.env.VUE_APP_NAME)])
            const progressStr = progress.map(t => {
                return `['${t.UpdateDate}',${t.Phrases},${t.Responses},${t.Score} ]`
            })
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
            body{
                font-family: Arial, Helvetica, sans-serif;
            }
            .tbl {
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
            const script = `<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
            <script>
                google.charts.load('current', {packages: ['corechart', 'line']});
                google.charts.setOnLoadCallback(drawBasic);
                function drawBasic() {
                    var data = google.visualization.arrayToDataTable([
                        ['Date', 'Phrases', 'Responses', 'Score'],
                        ${progressStr}
                      ]);
                      var options = {
                        title: 'How much personaility training your group has done',
                        chart: {title: '${process.env.VUE_APP_NAME}',
                        subtitle: 'How much personaility training your group has done'},
                        curveType: 'function',
                        legend: { position: 'bottom' }
                      };
                      var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
                      chart.draw(data, google.charts.Line.convertOptions(options));
                  }
            </script>`
            const html = `<!DOCTYPE html><head>${style}${script}<meta charset="UTF-8"></head>
            <body>
            <h1>${process.env.VUE_APP_NAME} - Progress</h1>
            <h2>Totals</h2>
            Score (Phrases + Responses): <strong>${phraseCount + responseCount}</strong><br>
            Training Phrases: <strong>${phraseCount}</strong><br>
            Training Responses: <strong>${responseCount}</strong><br>
            <div style="margin:15px" id="chart_div"></div>
            <br>
            <h2>Training List</h2>
            ${json2table(sorted, 'tbl')}<br>
            <hr>
            <h2>Cheat Sheet - Some Example Questions You May Have Missed</h2>
            ${json2table(cheatsheet, 'tbl')}
            </body></html>`

            // save this data to airtable
            await saveProgress({
                Bot: process.env.SERVICE_ACCOUNT_PROJECT_ID,
                Group: process.env.VUE_APP_NAME,
                UpdateDate: new Date().toISOString().split('T')[0],
                Intents: intentList.length,
                Phrases: phraseCount,
                Responses: responseCount,
                Score: phraseCount + responseCount
            })
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
