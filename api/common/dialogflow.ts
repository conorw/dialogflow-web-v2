import * as dialogflow from '@google-cloud/dialogflow'
import { saveFeedback } from './airtable'
import { search } from './search'
/* AgentsClient retrieves information about the agent */
export const agentsClient = new dialogflow.AgentsClient({
    credentials: {
        // <-- Initialize with service account
        private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/gm, '\n'),
        client_email: process.env.SERVICE_ACCOUNT_EMAIL
    }
})
export const intentClient = new dialogflow.IntentsClient({
    credentials: {
        // <-- Initialize with service account
        private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/gm, '\n'),
        client_email: process.env.SERVICE_ACCOUNT_EMAIL
    }
})
export const entityClient = new dialogflow.EntityTypesClient({
    credentials: {
        // <-- Initialize with service account
        private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/gm, '\n'),
        client_email: process.env.SERVICE_ACCOUNT_EMAIL
    }
})
/* SessionsClient makes text requests */
export const sessionClient = new dialogflow.SessionsClient({
    credentials: {
        // <-- Initialize with service account
        private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/gm, '\n'),
        client_email: process.env.SERVICE_ACCOUNT_EMAIL
    }
})
export const findIntent = async (intentDisplayName: string) => {
    let parent = intentClient.projectPath(process.env.PERSONALITY_ACCOUNT_PROJECT_ID)
    parent = `${parent}/agent`
    console.log(`Finding intent: ${intentDisplayName} | Parent: ${parent}`)
    const intents = await intentClient.listIntents({ parent }) as any[]
    let intent
    for (const t of intents){
        if (t){
            intent = t.find(r => {
                if (r.displayName){
                    console.log(r.displayName.toLowerCase())
                    return r.displayName.toLowerCase() === intentDisplayName.toLowerCase()
                }
                return false
            })
            if (intent){
                break
            }
        }
    }
    console.log(intent)
    return intent
}
export const findEntity = async (entityName: string) => {
    let parent = entityClient.projectPath(process.env.TRAINING_ACCOUNT_PROJECT_ID)
    parent = `${parent}/agent`
    console.log(`Finding entitiy: ${entityName}`)
    const entities = await entityClient.listEntityTypes({ parent }) as any[]
    let entity
    for (const t of entities){
        if (t){
            entity = t.find(r => {
                if (r.displayName){
                    console.log(r.displayName.toLowerCase())
                    return r.displayName.toLowerCase() === entityName.toLowerCase()
                }
                return false
            })
            if (entity){
                break
            }
        }
    }
    console.log(entity)
    return entity
}
export const updateIntent = async (intent: dialogflow.protos.google.cloud.dialogflow.v2.IIntent, displayName: string, questions: string[], answer: string) => {
    let parent = intentClient.projectPath(process.env.PERSONALITY_ACCOUNT_PROJECT_ID)
    parent = `${parent}/agent`
    console.log(parent)
    if (intent.messages.length){
        intent.messages[0].text.text.push(answer)
    } else {
        // check for duplicates before adding
        // eslint-disable-next-line no-lonely-if
        // if (!intent.messages[0].text.text.contains(answer)){
        intent.messages.push({ text: { text: [answer] } })
        // }
    }
    console.log(intent.trainingPhrases)
    if (intent.trainingPhrases.length){
        // check for duplicates before adding
        // questions = questions.filter(t=>intent.trainingPhrases.map(t=>t.parts).contains(t))
        intent.trainingPhrases[0].parts.push(...questions.map(t => { return { text: t } }))
    } else {
        intent.trainingPhrases.push({ parts: [...questions.map(t => { return { text: t } })] })
    }

    const newintent = await intentClient.updateIntent({ intent })
    console.log(newintent)
    return newintent
}
export const createIntent = async (displayName: string, questions: string[], answer: string) => {
    let parent = intentClient.projectPath(process.env.PERSONALITY_ACCOUNT_PROJECT_ID)
    parent = `${parent}/agent`
    console.log(parent)
    const newintent = await intentClient.createIntent({
        parent, intent: {
            displayName,
            trainingPhrases: questions.map(t => { return { parts: [{ text: t }] } }),
            messages: [{ text: { text: [answer] } }]
        }
    })
    console.log(newintent)
    return newintent
}
export const handleTrainingIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    console.log('TRAINING!!!')
    console.log(intentresponse.queryResult.parameters.fields)

    if (intentresponse.queryResult.parameters
                        && intentresponse.queryResult.parameters.fields
                        && intentresponse.queryResult.parameters.fields['training-answer']){
        const params = intentresponse.queryResult.parameters.fields
        console.log(params)
        const intentCategory = params['intent-category'] ? params['intent-category'].stringValue : ''
        const intentName = params['intent-name'] ? params['intent-name'].stringValue : ''
        const question1 = params['training-question-1'] ? params['training-question-1'].stringValue : ''
        const answer = params['training-answer'] ? params['training-answer'].stringValue : ''
        const trainingCategories = [{ title: 'general' },
            { title: 'emoji' },
            { title: 'about-bot' },
            { title: 'about-user' },
            { title: 'greeting' }]
        if (!intentCategory && answer){
            console.log('Adding category values to response')
            const newFulfillment = [{
                'platform': 'ACTIONS_ON_GOOGLE',
                'simpleResponses': {
                    'simpleResponses': [
                        {
                            'textToSpeech': `CATEGORY: You need to tell me what category this new skill belongs in?
\n
"about-bot" if the question will be about the bot
\n
"about-user" if its something the user might say about themselves
\n
"emoji" if you are going to train me how to reply to an emoji
\n
"greeting" if you are going to train me how to reply to things like "hello" and "goodbye"
\n
"general" if you dont know what category the question or phrase might belong to.`
                        }
                    ]
                }
            },
            {
                'platform': 'ACTIONS_ON_GOOGLE',
                'suggestions': {
                    'suggestions': trainingCategories
                }
            }] as any
            intentresponse.queryResult.fulfillmentMessages = newFulfillment
        }
        // if this is the intent-name question, return the entity options for the category
        if (intentCategory && !intentName){
            console.log('Adding category values to response')
            const subCategories = await findEntity(`${intentCategory}-options`)
            if (subCategories){
                const newFulfillment = [{
                    'platform': 'ACTIONS_ON_GOOGLE',
                    'simpleResponses': {
                        'simpleResponses': [
                            {
                                'textToSpeech': `MEMORABLE NAME: 
Give your question a name so you can add more details when you are finished.
If a suitable option is not available below, just type a new name`
                            }
                        ]
                    }
                },
                {
                    'platform': 'ACTIONS_ON_GOOGLE',
                    'suggestions': {
                        'suggestions': subCategories.entities.map(t => { return { title: t.value } })
                    }
                }] as any
                intentresponse.queryResult.fulfillmentMessages = newFulfillment
            }
        }
        if (question1
                            && answer
                            && intentName
                            && intentCategory){
            const lowerIntentName = intentName.toLowerCase().replace(' ', '.').trim()
            const lowerIntentCategory = intentCategory.toLowerCase().replace(' ', '-').trim()
            const combinedName = `${lowerIntentCategory}.${lowerIntentName}`
            console.log({ combinedName, intentCategory, intentName, question1, answer })
            console.log(`Creating new intent:${combinedName}`)
            const intent = await findIntent(combinedName)
            console.log(intent)
            if (intent){
                console.log('Update existing intent')
                await updateIntent(intent, combinedName, [question1], answer)
            } else {
                console.log('Create new intent')
                await createIntent(combinedName, [question1], answer)
            }
        }
    }
    return intentresponse
}
export const getFormattedFulfillment = (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    const fulfillment = intentresponse.queryResult.fulfillmentMessages

    /* Base of formatted response */
    const formatted = {
        id: intentresponse.responseId,
        action: intentresponse.queryResult.action,
        query: intentresponse.queryResult.queryText,
        params: intentresponse.queryResult.parameters,
        diagnosticInfo: intentresponse.queryResult.diagnosticInfo,
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

    return fulfillment
}

export const handleFeedbackIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    if (intentresponse.queryResult.parameters
        && intentresponse.queryResult.parameters.fields
        && intentresponse.queryResult.parameters.fields['feedback-answer']
        && intentresponse.queryResult.parameters.fields['feedback-name']){
        const params = intentresponse.queryResult.parameters.fields
        const feedbackName = params['feedback-name'].stringValue
        const feedbackAnswer = params['feedback-answer'].stringValue
        if (feedbackName && feedbackAnswer){
            await saveFeedback(feedbackAnswer, feedbackName)
        }
    }
    return intentresponse
}
export const handleSearchIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    console.log('SEARCH!!!')
    console.log(intentresponse.queryResult.parameters.fields)

    if (intentresponse.queryResult.parameters
                        && intentresponse.queryResult.parameters.fields
                        && intentresponse.queryResult.parameters.fields.q){
        const params = intentresponse.queryResult.parameters.fields
        const service = params.service ? params.service.stringValue : ''
        const q = params.q ? params.q.stringValue : ''
        console.log('Searching...', {params, service, q, intentresponse})
        // if this is the intent-name question, return the entity options for the category
        if (q){
            console.log('Searching web')
            const searchResult = await search(q)
            if (searchResult){
                const newFulfillment = [{
                    'platform': 'ACTIONS_ON_GOOGLE',
                    'basicCard': {
                        'title': 'Search Result',
                        'subtitle': `Powered by ${searchResult.Engine} & ${searchResult.AbstractSource}`,
                        'formattedText': searchResult.AbstractText,
                        'image': {},
                        'buttons': [
                            {
                                'title': `View on ${searchResult.AbstractSource}`,
                                'openUriAction': {
                                    'uri': searchResult.AbstractURL
                                }
                            }
                        ]
                    }
                }] as any
                intentresponse.queryResult.fulfillmentMessages = newFulfillment
            } else {
                const newFulfillment = [{
                    'platform': 'ACTIONS_ON_GOOGLE',
                    'basicCard': {
                        'title': 'No Results',
                        'subtitle': 'Sorry, I didn\'t find any answers online.',
                        'formattedText': 'Try asking in a different way. Or would you like to open google search?',
                        'image': {},
                        'buttons': [
                            {
                                'title': 'View on Google',
                                'openUriAction': {
                                    'uri': `https://www.google.com/search?q=${encodeURIComponent(q)}`
                                }
                            }
                        ]
                    }
                }] as any
                intentresponse.queryResult.fulfillmentMessages = newFulfillment
            }
        }
    }
    return intentresponse
}
