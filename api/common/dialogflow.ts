import * as dialogflow from '@google-cloud/dialogflow'

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
    console.log(parent)
    console.log(`Finding intent: ${intentDisplayName}`)
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

