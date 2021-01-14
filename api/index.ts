/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { agentsClient, sessionClient, getFormattedFulfillment, handleTrainingIntent, handleFeedbackIntent, handleSearchIntent, handleTrainingFollowUpIntent, handleTrainingIntentList, handleTopicIntent, handleFallbackIntent, handleHelpIntent } from '../common/dialogflow'
import * as dialogflow from '@google-cloud/dialogflow'
import { setCORSHeaders } from '../common/utils'

export default async (req: NowRequest, res: NowResponse) => {
    res = setCORSHeaders(res)
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
                if (intentresponse.queryResult){
                    if (intentresponse.queryResult.intent.isFallback){
                        intentresponse = await handleFallbackIntent(intentresponse)
                    }
                    switch (intentresponse.queryResult.intent.displayName){
                    case 'feedback':
                        intentresponse = await handleFeedbackIntent(intentresponse)
                        break
                    case 'help':
                        intentresponse = await handleHelpIntent(intentresponse)
                        break
                    case 'troubling.topics':
                        intentresponse = await handleTopicIntent(intentresponse)
                        break
                    case 'training.category.details':
                        intentresponse = await handleTrainingIntent(intentresponse)
                        break
                    case 'training.intents':
                        intentresponse = await handleTrainingIntentList(intentresponse)
                        break
                    case 'training.category.details.followup':
                        intentresponse = await handleTrainingFollowUpIntent(intentresponse)
                        break
                    case 'web.search':
                        intentresponse = await handleSearchIntent(intentresponse)
                        break
                    default:
                        break
                    }
                }
                if (req.query.format == 'true'){
                    const formatted = getFormattedFulfillment(intentresponse)
                    res.send(formatted)
                } else {
                    res.send(intentresponse)
                }
            } catch (error){
                console.log(error)
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
