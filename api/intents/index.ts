/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { getCheatSheet, getProgress, saveProgress } from '../../common/airtable'
import { getAgentJSON } from '../../common/dialogflow'
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
            const [cheatsheet, progress] = await Promise.all([
                getCheatSheet(),
                getProgress(process.env.VUE_APP_NAME)
            ])
            const progressStr = progress.map(t => {
                return `['${t.UpdateDate}',${t.Phrases},${t.Responses},${t.Score} ]`
            })
            const intentList = []
            // res.send(intents)

            const sorted = await getAgentJSON()
            const phraseCount = sorted.map(t => t.user_says.length).reduce((a, b) => a + b)
            const responseCount = sorted.map(t => t.bot_says.length).reduce((a, b) => a + b)
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
            <div id="editList"></div>
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
