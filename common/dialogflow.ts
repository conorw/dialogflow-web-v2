/* eslint-disable no-param-reassign */
import * as dialogflow from '@google-cloud/dialogflow'
import { getTopicResource, saveFeedback, saveTopic, updateDBIntentId } from './airtable'
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

/* SessionsClient makes text requests */
export const conextClient = new dialogflow.ContextsClient({
    credentials: {
        // <-- Initialize with service account
        private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/gm, '\n'),
        client_email: process.env.SERVICE_ACCOUNT_EMAIL
    }
})

const trainingCategories = [{ title: 'general' },
    { title: 'emoji' },
    { title: 'about-bot' },
    { title: 'about-user' },
    { title: 'greeting' }]

const FOLLOWUP_PARENT = 'parent-intent'

export const findAllIntents = async (intentView: 'INTENT_VIEW_FULL' | 'INTENT_VIEW_UNSPECIFIED' = 'INTENT_VIEW_FULL') => {
    let parent = intentClient.projectPath(process.env.PERSONALITY_ACCOUNT_PROJECT_ID)
    parent = `${parent}/agent`
    const ret = await intentClient.listIntents({ parent, intentView })
    return ret
}
export const findIntentById = async (id: string) => {
    const ret = await intentClient.getIntent({ name: id, intentView: 'INTENT_VIEW_FULL' })
    return ret.length ? ret[0] : null
}
export const findIntent = async (intentDisplayName: string) => {
    const intents = await findAllIntents()
    let intent
    for (const t of intents){
        if (t && Array.isArray(t)){
            intent = t.find(r => {
                if (r.displayName){
                    return r.displayName.toLowerCase() === intentDisplayName.toLowerCase()
                }
                return false
            })
            if (intent){
                break
            }
        }
    }
    return intent
}
export const findEntity = async (entityName: string) => {
    let parent = entityClient.projectPath(process.env.TRAINING_ACCOUNT_PROJECT_ID)
    parent = `${parent}/agent`
    const entities = await entityClient.listEntityTypes({ parent })
    let entity
    for (const t of entities){
        if (t && Array.isArray(t)){
            entity = t.find(r => {
                if (r.displayName){
                    return r.displayName.toLowerCase() === entityName.toLowerCase()
                }
                return false
            })
            if (entity){
                break
            }
        }
    }
    return entity
}
export const updateIntent = async (intent: dialogflow.protos.google.cloud.dialogflow.v2.IIntent,
    displayName: string, questions: string[], answer: string[], parent: string = '', override: boolean = false) => {
    // let parent = intentClient.projectPath(process.env.PERSONALITY_ACCOUNT_PROJECT_ID)
    // parent = `${parent}/agent`
    // console.log(parent)
    if (displayName){
        intent.displayName = displayName.trim()
    }
    if (parent){
        console.log('adding input context', {parent})
        if (!intent.inputContextNames){
            intent.inputContextNames = [parent]
        } else if (!intent.inputContextNames.find(t => t === parent)){
            intent.inputContextNames.push(parent)
        }
    }
    if (!intent.messages.length || override){
        if (!intent.messages.length){
            intent.messages.push({text: {text: answer}})
        } else {
            intent.messages[0].text.text = answer
        }
    } else {
        // check for duplicates before adding
        // eslint-disable-next-line no-lonely-if
        answer.forEach(ans => {
            if (!intent.messages[0].text.text.find(t => t.toLocaleLowerCase() === ans.toLowerCase())){
                console.log('pusing new response', { ans })
                intent.messages[0].text.text.push(...ans)
            }
        })
    }
    if (override){
        intent.trainingPhrases = questions.map(t => { return { parts: [{ text: t }] } })
    } else if (intent.trainingPhrases.length){
        console.log('Existing phrases')
        // check for duplicates before adding
        questions.forEach(question => {
            console.log('finding phrases', { parts: intent.trainingPhrases[0].parts, question })
            if (!intent.trainingPhrases.find(t => t.parts.find(t => t.text.toLocaleLowerCase() === question.toLowerCase()))){
                console.log('Adding question', { question })
                intent.trainingPhrases.push({ parts: [{ text: question }] })
            }
        })
    } else {
        // console.log('no phrases', {intent})
        intent.trainingPhrases.push(...questions.map(t => { return { parts: [{ text: t }] } }))
    }
    const newintent = await intentClient.updateIntent({ intent })
    return newintent
}
export const createIntent = async (displayName: string, questions: string[], answer: string[], inputContext?: string) => {
    let parent = intentClient.projectPath(process.env.PERSONALITY_ACCOUNT_PROJECT_ID)
    parent = `${parent}/agent`
    if (inputContext){
        inputContext.startsWith(`${parent}/sessions/-/contexts)`)
            ? inputContext : `${parent}/sessions/-/contexts/${inputContext.replace(/\./gi, '-')}`
    }
    const newintent = await intentClient.createIntent({
        parent, intent: {
            // parentFollowupIntentName: inputContext,
            inputContextNames: inputContext ? [inputContext.startsWith(`${parent}/sessions/-/contexts)`)
                ? inputContext : inputContext] : undefined,
            displayName: displayName.trim(),
            outputContexts: [{
                lifespanCount: 2,
                parameters: {
                    fields: {
                        'question': { stringValue: questions[0] },
                        'response': { stringValue: answer[0] }
                    }
                },
                name: `${parent}/sessions/-/contexts/${displayName.replace(/\./gi, '-')}`
            }],
            trainingPhrases: questions.map(t => { return { parts: [{ text: t }] } }),
            messages: [{ text: { text: answer } }]
        }
    })
    // console.log(newintent)
    return newintent
}
export const handleTrainingIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    console.log('TRAINING!!!')

    if (intentresponse.queryResult.parameters
        && intentresponse.queryResult.parameters.fields
        && intentresponse.queryResult.parameters.fields.answer){
        const params = intentresponse.queryResult.parameters.fields
        const intentCategory = params.category ? params.category.stringValue : ''
        const intentName = params.name ? params.name.stringValue : ''
        const question1 = params.question ? params.question.stringValue : ''
        const answer = params.answer ? params.answer.stringValue : ''
        if (!intentCategory && answer){
            console.log('Adding category values to response')
            const newFulfillment: any = [{
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
            }]
            intentresponse.queryResult.fulfillmentMessages = newFulfillment
        }
        // if this is the intent-name question, return the entity options for the category
        if (intentCategory && !intentName){
            console.log('Adding category values to response')
            const subCategories = await findEntity(`${intentCategory}-options`)
            if (subCategories){
                const newFulfillment: any = [{
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
                }]
                intentresponse.queryResult.fulfillmentMessages = newFulfillment
            }
        }
        if (question1
            && answer
            && intentName
            && intentCategory){
            const lowerIntentName = intentName.toLowerCase().replace(/ /gi, '.').trim()
            const lowerIntentCategory = intentCategory.toLowerCase().replace(/ /gi, '-').trim()
            const combinedName = `${lowerIntentCategory}.${lowerIntentName}`
            const intent = await findIntent(combinedName)
            if (intent){
                console.log('Update existing intent')
                await updateIntent(intent, combinedName, [question1], [answer])
            } else {
                console.log('Create new intent')
                await createIntent(combinedName, [question1], [answer])
            }
            await updateParentContext(intentresponse.queryResult.outputContexts, combinedName, question1, answer)
        }
    }
    return intentresponse
}
export const handleTrainingFollowUpIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    // console.log('TRAINING FOLLOWUP!!!', intentresponse)

    if (intentresponse.queryResult.parameters
        && intentresponse.queryResult.allRequiredParamsPresent){
        const params = intentresponse.queryResult.parameters.fields
        const parentContext = intentresponse.queryResult.outputContexts.find(t => t.name.toLowerCase().includes(FOLLOWUP_PARENT))
        // const newContext = intentresponse.queryResult.outputContexts.find(t => t.name.toLowerCase().includes(FOLLOWUP_CONTEXT))

        console.log('CONTEXTS', { parentContext })

        const intentCategory = parentContext.parameters.fields.category.stringValue
        const intentName = parentContext.parameters.fields.name.stringValue
        const followUpintentName = params['followup-training-name'] ? params['followup-training-name'].stringValue : ''
        const question1 = params['followup-training-question-1'] ? params['followup-training-question-1'].stringValue : ''
        const answer = params['followup-training-answer'] ? params['followup-training-answer'].stringValue : ''

        if (question1
            && answer
            && intentName
            && intentCategory){
            const lowerIntentName = intentName.toLowerCase().replace(/ /gi, '.').trim()
            const lowerFollowUpIntentName = followUpintentName.toLowerCase().replace(/ /gi, '.').trim()
            const previousContext = lowerIntentName
            const combinedName = `${previousContext}.${lowerFollowUpIntentName}`
            console.log('followup names', { combinedName, intentCategory, intentName, question1, answer })
            console.log(`Creating followup intent:${combinedName}`, { previousContext })
            const intent = await findIntent(combinedName)
            // console.log(intent)
            if (intent){
                console.log('Update existing followup intent')
                await updateIntent(intent, combinedName, [question1], [answer])
            } else {
                console.log('Create new followup intent')
                await createIntent(combinedName, [question1], [answer], previousContext)
            }
            // intentresponse.queryResult.outputContexts = intentresponse.queryResult.outputContexts.filter(t => !t.name.toLowerCase().includes(FOLLOWUP_PARENT))
            // intentresponse.queryResult.outputContexts.push(parentContext)
            await updateParentContext(intentresponse.queryResult.outputContexts, combinedName, question1, answer)
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
export const setFallbackFailure = (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse, count: number) => {
    console.log('Setting fallback count:', { field: intentresponse.queryResult.outputContexts[0].parameters.fields })
    if (intentresponse.queryResult.outputContexts[0].parameters.fields['no-match']){
        intentresponse.queryResult.outputContexts[0].parameters.fields['no-match'].numberValue = count
        return conextClient.updateContext({ context: intentresponse.queryResult.outputContexts[0] })
    }
    return false
}
export const handleFallbackIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    if (intentresponse.queryResult.outputContexts && intentresponse.queryResult.outputContexts[0].parameters && intentresponse.queryResult.outputContexts[0].parameters.fields['no-match']){
        const count = intentresponse.queryResult.outputContexts[0].parameters.fields['no-match'].numberValue || 0
        console.log('fallback', { params: intentresponse.queryResult.outputContexts[0].parameters.fields })
        if (count > 4){
            // something wrong here, reset
            await setFallbackFailure(intentresponse, 0)
        } else if (count > 3){
            const fallbackMsg = `Sorry.\n
            I still dont know how to reply so I have searched the internet for the term "${intentresponse.queryResult.queryText}"..\n`
            intentresponse = await addSearchToResponse(intentresponse.queryResult.queryText, intentresponse, fallbackMsg)
            await setFallbackFailure(intentresponse, 0)
        } else {
            await setFallbackFailure(intentresponse, count)
        }
    }
    return intentresponse
}
export const handleTopicIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    if (intentresponse.queryResult.parameters
        && intentresponse.queryResult.parameters.fields
        && intentresponse.queryResult.parameters.fields['feedback-answer']){
        const params = intentresponse.queryResult.parameters.fields
        const feedbackAnswer = params['feedback-answer'].stringValue
        if (feedbackAnswer){
            await saveTopic(feedbackAnswer)
        }
    }
    return intentresponse
}
export const updateParentContext = async (contexts: dialogflow.protos.google.cloud.dialogflow.v2.IContext[],
    combinedName: string,
    question1: string,
    answer: string) => {
    try {
        const parentContext = contexts.find(t => t.name.toLowerCase().includes(FOLLOWUP_PARENT))
        if (parentContext){
            parentContext.parameters.fields = {
                ...parentContext.parameters.fields,
                'name': { stringValue: combinedName },
                'question': { stringValue: question1 },
                'answer': { stringValue: answer }
            }
            const ret = await conextClient.updateContext({ context: parentContext })
            return ret
        }
    } catch (error){
        console.log(error)
    }
}
export const handleSearchIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    console.log('SEARCH!!!')

    if (intentresponse.queryResult.parameters
        && intentresponse.queryResult.parameters.fields
        && intentresponse.queryResult.parameters.fields.q){
        const params = intentresponse.queryResult.parameters.fields
        const service = params.service ? params.service.stringValue : ''
        const q = params.q ? params.q.stringValue : ''
        console.log('Searching...', { params, service, q, intentresponse })
        // if this is the intent-name question, return the entity options for the category
        if (q){
            console.log('Searching web')
            // eslint-disable-next-line no-param-reassign
            intentresponse = await addSearchToResponse(q, intentresponse, 'Search Result')
        }
    }
    return intentresponse
}
export const handleHelpIntent = async (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    console.log('HELP!!!')

    if (intentresponse.queryResult.parameters
        && intentresponse.queryResult.parameters.fields
        && intentresponse.queryResult.parameters.fields.topic){
        const params = intentresponse.queryResult.parameters.fields
        const topic = params.topic ? params.topic.stringValue : ''
        const resource = params['resource-type'] ? params['resource-type'].stringValue : ''
        // if this is the intent-name question, return the entity options for the category
        if (topic && resource){
            console.log('Lookup help', { topic, resource })
            // eslint-disable-next-line no-param-reassign
            intentresponse = await addHelpToResponse(intentresponse, topic, resource)
        }
    }
    return intentresponse
}
const addSearchToResponse = async (q: string, intentresponse, title?: string) => {
    const searchResult = await search(q)
    if (searchResult){
        const buttons = []
        if (searchResult.AbstractURL){
            buttons.push({
                'title': `View on ${searchResult.AbstractSource}`,
                'openUriAction': {
                    'uri': searchResult.AbstractURL
                }
            })
        }
        const newFulfillment: any = [{
            'platform': 'ACTIONS_ON_GOOGLE',
            'basicCard': {
                title,
                'subtitle': `Response powered by ${searchResult.Engine} ${searchResult.AbstractSource ? `& ${searchResult.AbstractSource}` : ''}`,
                'formattedText': searchResult.AbstractText,
                'image': {},
                buttons
            }
        }]
        intentresponse.queryResult.fulfillmentMessages = newFulfillment
    } else {
        const newFulfillment: any = [{
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
        }]
        intentresponse.queryResult.fulfillmentMessages = newFulfillment
    }
    return intentresponse
}
const addHelpToResponse = async (intentresponse, topic: string, resource: string) => {
    const searchResult = await getTopicResource(topic, resource)
    if (searchResult){
        const buttons = []
        if (searchResult.resource_link[0]){
            let action = 'Open Now'
            switch (searchResult.resource_type[0]){
            case 'text':
                action = 'SMS Now'
                break
            case 'phone':
                action = 'Phone Now'
                break
            default:
                break
            }
            searchResult.resource_type === 'text'
            buttons.push({
                'title': action,
                'openUriAction': {
                    'uri': searchResult.resource_link[0]
                }
            })
        }
        const newFulfillment: any = [{
            'platform': 'ACTIONS_ON_GOOGLE',
            'basicCard': {
                'title': searchResult.resource_name[0],
                'formattedText': searchResult.resource_desc[0],
                'image': {},
                buttons
            }
        }]
        intentresponse.queryResult.fulfillmentMessages = newFulfillment
    }
    return intentresponse
}
export type JSONIntent = {
    id: string;
    bot: string;
    parent?: string;
    output?: string;
    intent_name: string;
    user_says: string[];
    bot_says: string[];
}
export const getAgentJSON = async (): Promise<JSONIntent[]> => {
    const [intents] = await Promise.all([findAllIntents('INTENT_VIEW_FULL')])
    const intentList: JSONIntent[] = []
    // res.send(intents)
    intents.forEach(intent => {
        if (intent){
            intent.forEach(t => {
                const user_says = t.trainingPhrases.map(t => t.parts.map(r => r.text)).reduce((a, b) => a.concat(b), [])
                const bot_says = t.messages.map(r => r.text.text).reduce((a, b) => a.concat(b), [])
                intentList.push({
                    id: t.name,
                    parent: t.inputContextNames.length ? t.inputContextNames[0] : null,
                    output: t.outputContexts.length ? t.outputContexts[0].name : null,
                    bot: process.env.PERSONALITY_ACCOUNT_PROJECT_ID,
                    intent_name: t.displayName,
                    user_says,
                    bot_says
                })
            })
        }
    })
    return intentList.sort((a, b) => {
        return a.intent_name.localeCompare(b.intent_name)
    })
}
export const updateSingleIntent = async (intent: JSONIntent) => {
    let existing = null
    if (intent.id && !intent.id.toLowerCase().startsWith('new:')){
        existing = await findIntentById(intent.id)
    }

    if (!existing){
        console.log('CREATING INTENT')
        const newIntent = await createIntent(intent.intent_name, intent.user_says, intent.bot_says, intent.parent)
        // add the id to the table
        intent = {...intent, id: newIntent[0].name}
    } else {
        console.log('UPDATING INTENT')
        // otherwise update existing with details
        await updateIntent(existing, intent.intent_name, intent.user_says, intent.bot_says, intent.parent, true)
    }
    return intent
}
export const updateAllIntents = (sorted: JSONIntent[]) => {
    return Promise.all(sorted.map(intent => {
        // see if intent exists, if not add it
        return updateSingleIntent(intent)
    }))
}
export const handleTrainingIntentList = (intentresponse: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentResponse) => {
    const newFulfillment: any = [{
        'platform': 'ACTIONS_ON_GOOGLE',
        'basicCard': {
            'title': 'View All Training',
            'subtitle': process.env.VUE_APP_NAME,
            'formattedText': 'View all the current personality training that your group has done.',
            'image': {},
            'buttons': [
                {
                    'title': 'View Now',
                    'openUriAction': {
                        'uri': `${process.env.VUE_APP_BOT_GATEWAY_URL}/intents`
                    }
                }
            ]
        }
    }]
    intentresponse.queryResult.fulfillmentMessages = newFulfillment

    return intentresponse
}
