import { NowRequest, NowResponse } from '@vercel/node'
import { findAllIntents } from '../common/dialogflow'
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
            // res.send(intents)
            intents.forEach(intent => {
                if (intent){
                    intent.forEach(t => {
                        intentList.push({name: t.displayName,
                            statements: t.trainingPhrases.map(t => t.parts.map(r => r.text)).reduce((a, b) => a.concat(b), []),
                            responses: t.messages.map(r => r.text.text).reduce((a, b) => a.concat(b), [])
                        })
                    })
                }
            })
            res.send(intentList.sort((a, b) => {
                return a.name.localeCompare(b.name)
            }))
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
