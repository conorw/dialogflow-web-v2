import { NowRequest, NowResponse } from '@vercel/node'
import { agentsClient, sessionClient, getFormattedFulfillment, handleTrainingIntent, handleFeedbackIntent, handleSearchIntent } from './common/dialogflow'
import * as dialogflow from '@google-cloud/dialogflow'

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
            const agent = await agentsClient.getAgent({ parent: `projects/${process.env.SERVICE_ACCOUNT_PROJECT_ID}` })
            res.send(agent[0])
        } catch (error){
            res.statusCode = 500
            res.send(error.message)
        }
    } else if (req.method == 'POST'){
        /* Detect Intent (send a query to dialogflow) */
        /* If no body, session, query, or lang, return 400 */
        if (!req.body || !req.body.session || !req.body.queryInput){
            res.statusCode = 400
            res.send('Invalid body')
        } else {
            /* Prepare dialogflow request */
            const session_id = req.body.session

            const sessionPath = sessionClient.projectAgentSessionPath(process.env.SERVICE_ACCOUNT_PROJECT_ID,
                session_id)
            const request = {
                session: sessionPath,
                queryInput: req.body.queryInput
            }

            try {
                /* Send our request to Dialogflow */
                const responses = await sessionClient.detectIntent(request)
                /* If the response should be formatted (?format=true), then return the format the response */
                let intentresponse = responses[0] as dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse
                if (intentresponse.queryResult && intentresponse.queryResult.intent.displayName === 'feedback'){
                    intentresponse = await handleFeedbackIntent(intentresponse)
                } else if (intentresponse.queryResult && intentresponse.queryResult.intent.displayName === 'training.category.details'){
                    intentresponse = await handleTrainingIntent(intentresponse)
                } else if (intentresponse.queryResult && intentresponse.queryResult.intent.displayName === 'web.search'){
                    intentresponse = await handleSearchIntent(intentresponse)
                }
                if (req.query.format == 'true'){
                    const formatted = getFormattedFulfillment(intentresponse)
                    res.send(formatted)
                } else {
                    res.send(intentresponse)
                }
            } catch (error){
                res.statusCode = 500
                res.send(error.message)
            }
        }
    } else if (req.method == 'OPTIONS'){
        /* Pass pre-flight HTTP check */
        res.send(200)
    } else {
        /* Send 404 on undefined method */
        res.send(404)
    }
}
