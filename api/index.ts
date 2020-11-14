import { NowRequest, NowResponse } from '@vercel/node'
const dialogflow = require('dialogflow')
// SERVICE_ACCOUNT_PROJECT_ID
// SERVICE_ACCOUNT_PRIVATE_KEY
// SERVICE_ACCOUNT_EMAIL
// const serviceAccount = require('./service_account.json') // <-- change service_account to yours

/* AgentsClient retrieves information about the agent */
const agentsClient = new dialogflow.AgentsClient({
    credentials: {
    // <-- Initialize with service account
        private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.SERVICE_ACCOUNT_EMAIL
    }
})
/* SessionsClient makes text requests */
const sessionClient = new dialogflow.SessionsClient({
    credentials: {
    // <-- Initialize with service account
        private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.SERVICE_ACCOUNT_EMAIL
    }
})

export default (req: NowRequest, res: NowResponse) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    /* On GET request return the information about the agent */
    if (req.method == 'GET'){
        agentsClient.getAgent({ parent: `projects/${process.env.SERVICE_ACCOUNT_PROJECT_ID}` },
            {},
            (err, agent) => {
                if (err){
                    res.statusCode = 500
                    res.send(err.message)
                } else {
                    res.send(agent)
                }
            })
    } else if (req.method == 'POST'){
    /* Detect Intent (send a query to dialogflow) */
    /* If no body, session, query, or lang, return 400 */
        if (!req.body || !req.body.session || !req.body.queryInput){
            res.statusCode = 400
            res.send('Invalid body')
        } else {
            /* Prepare dialogflow request */
            const session_id = req.body.session

            const sessionPath = sessionClient.sessionPath(process.env.SERVICE_ACCOUNT_PROJECT_ID,
                session_id)
            const request = {
                session: sessionPath,
                queryInput: req.body.queryInput
            }

            /* Send our request to Dialogflow */
            sessionClient
            .detectIntent(request)
            .then(responses => {
                /* If the response should be formatted (?format=true), then return the format the response */
                console.log(responses)
                if (req.query.format == 'true'){
                    const fulfillment = responses[0].queryResult.fulfillmentMessages

                    /* Base of formatted response */
                    const formatted = {
                        id: responses[0].responseId,
                        action: responses[0].queryResult.action,
                        query: responses[0].queryResult.queryText,
                        params: responses[0].queryResult.parameters,
                        diagnosticInfo: responses[0].queryResult.diagnosticInfo,
                        components: []
                    }

                    /* Iterate through components and add them to components list */
                    for (const component in fulfillment){
                        /* Recognize Dialogflow, Messenger and Webhook components */
                        if (
                            fulfillment[component].platform == 'PLATFORM_UNSPECIFIED' ||
                fulfillment[component].platform == 'FACEBOOK' ||
                fulfillment[component].platform == 'SLACK' ||
                fulfillment[component].platform == 'TELEGRAM' ||
                fulfillment[component].platform == 'KIK' ||
                fulfillment[component].platform == 'VIBER' ||
                fulfillment[component].platform == 'SKYPE' ||
                fulfillment[component].platform == 'LINE'
                        ){
                            if (fulfillment[component].text){
                                /* Text */
                                formatted.components.push({
                                    name: 'DEFAULT',
                                    content: fulfillment[component].text.text[0]
                                })
                            }

                            if (fulfillment[component].card){
                                /* Convert Card to Actions on Google Card (to follow a common format) */
                                const google_card = {
                                    title: fulfillment[component].card.title,
                                    formattedText: fulfillment[component].card.subtitle,
                                    image: {
                                        imageUri: fulfillment[component].card.imageUri,
                                        accessibilityText: 'Card Image'
                                    },
                                    buttons: []
                                }

                                for (const button in fulfillment[component].card.buttons){
                                    google_card.buttons.push({
                                        title: fulfillment[component].card.buttons[button].text,
                                        openUriAction: {
                                            uri:
                          fulfillment[component].card.buttons[button].postback
                                        }
                                    })
                                }

                                formatted.components.push({
                                    name: 'CARD',
                                    content: google_card
                                })
                            }

                            if (fulfillment[component].image){
                                /* Image */
                                formatted.components.push({
                                    name: 'IMAGE',
                                    content: fulfillment[component].image
                                })
                            }

                            if (fulfillment[component].quickReplies){
                                /* Suggestions */
                                formatted.components.push({
                                    name: 'SUGGESTIONS',
                                    content: fulfillment[component].quickReplies.quickReplies
                                })
                            }

                            if (fulfillment[component].payload){
                                /* Payload */
                                formatted.components.push({
                                    name: 'PAYLOAD',
                                    content: fulfillment[component].payload
                                })
                            }
                        }

                        /* Recognize Actions on Google components */
                        if (fulfillment[component].platform == 'ACTIONS_ON_GOOGLE'){
                            if (fulfillment[component].simpleResponses){
                                /* Google Simple Response */
                                formatted.components.push({
                                    name: 'SIMPLE_RESPONSE',
                                    content:
                      fulfillment[component].simpleResponses.simpleResponses[0]
                                })
                            }

                            if (fulfillment[component].basicCard){
                                /* Google Card */
                                formatted.components.push({
                                    name: 'CARD',
                                    content: fulfillment[component].basicCard
                                })
                            }

                            if (fulfillment[component].listSelect){
                                /* Google List */
                                formatted.components.push({
                                    name: 'LIST',
                                    content: fulfillment[component].listSelect
                                })
                            }

                            if (fulfillment[component].suggestions){
                                /* Convert Google Suggestions to text-only suggestions (like the webhook quick-replies) */
                                const suggestions = fulfillment[
                                component
                                ].suggestions.suggestions.map(suggestion => suggestion.title)
                                formatted.components.push({
                                    name: 'SUGGESTIONS',
                                    content: suggestions
                                })
                            }

                            if (fulfillment[component].linkOutSuggestion){
                                /* Google Link out suggestion */
                                formatted.components.push({
                                    name: 'LINK_OUT_SUGGESTION',
                                    content: fulfillment[component].linkOutSuggestion
                                })
                            }

                            if (fulfillment[component].payload){
                                /* Google Payload */
                                formatted.components.push({
                                    name: 'PAYLOAD',
                                    content: fulfillment[component].payload
                                })
                            }

                            if (fulfillment[component].carouselSelect){
                                /* Google Carousel Card */
                                formatted.components.push({
                                    name: 'CAROUSEL_CARD',
                                    content: fulfillment[component].carouselSelect.items
                                })
                            }
                        }
                    }

                    res.send(formatted)
                } else {
                    res.send(responses[0])
                }
            })
            .catch(err => {
                res.statusCode = 500
                res.send(err.message)
            })
        }
    } else if (req.method == 'OPTIONS'){
    /* Pass pre-flight HTTP check */
        res.send(200)
    } else {
    /* Send 404 on undefined method */
        res.send(404)
    }
}
