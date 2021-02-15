/* eslint-disable no-undef */

import Airtable from 'airtable'
import { JSONIntent } from './dialogflow'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE)

export const saveFeedback = async (answer: string, name: string) => {
    const url = process.env.SERVICE_ACCOUNT_PROJECT_ID

    try {
        await base('feedback').create([
            {
                'fields': { answer, name, url }
            }
        ])
    } catch (error){
        console.log(error)
    }
}

export const saveProgress = async (progress: any) => {
    try {
        const filter = `AND({Group}="${progress.Group}", {UpdateDate}=DATETIME_PARSE("${progress.UpdateDate}",""))`
        const exists = await base('progress').select({ filterByFormula: filter }).all()
        if (exists.length > 0){
            await base('progress').update([
                {
                    id: exists[0].id,
                    fields: progress
                }
            ])
        } else {
            await base('progress').create([
                {
                    'fields': progress
                }
            ])
        }
    } catch (error){
        console.log(error)
    }
}
export const getProgress = async (group: string) => {
    try {
        const filter = `{Group}="${group}"`
        const exists = await base('progress').select({ filterByFormula: filter, sort: [{ field: 'UpdateDate' }] }).all()
        return exists.map(t => t.fields)
    } catch (error){
        console.log(error)
    }
}
export const getTopicResources = async (topics: string[]) => {
    try {
        const filter = `OR(${topics.map(t => `LOWER({topic})="${t.toLowerCase()}"`)})`
        console.log(filter, {topics})
        const exists = await base('topics').select({ filterByFormula: filter }).all()
        return exists.length ? exists.map(t => t.fields) : []
    } catch (error){
        console.log(error)
    }
}
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size))
export const removeBotResponses = async (bot: string) => {
    try {
        const filter = `{bot}="${bot}"`
        const exists = await base('responses').select({ filterByFormula: filter }).all()
        return Promise.all(chunk(exists.map(t => t.id), 10).map(t => base('responses').destroy(t)))
    } catch (error){
        console.log(error)
    }
}
export const getBotResponses = async (bot: string) => {
    try {
        const filter = `{bot}="${bot}"`
        const exists = await base('responses').select({ filterByFormula: filter }).all()
        return exists.map(t => t.fields)
    } catch (error){
        console.log(error)
    }
}
export const saveUnknown = async (statement: string, context: string, percentage: number) => {
    const bot = process.env.SERVICE_ACCOUNT_PROJECT_ID
    try {
        // see if it exists
        const filter = `AND({bot}="${bot}", LOWER({statement})="${statement.toLowerCase()}")`
        const exists = await base('responses').select({ filterByFormula: filter }).firstPage()
        const existing = exists.length ? exists[0].getId() : ''

        if (existing){
            await base('unknowns').update([
                {
                    'id': existing,
                    'fields': { count: exists[0].fields.count + 1 }
                }
            ])
        } else {
            await base('unknowns').create([
                {
                    'fields': { bot, statement, context, percentage }
                }
            ])
        }
    } catch (error){
        console.log(error)
    }
}
export const deleteUnknown = async (id: any) => {
    try {
        await base('unknowns').update([{id, fields: {completed: true}}])
    } catch (error){
        console.log(error)
    }
}
export const getBotUnknowns = async () => {
    try {
        const filter = `AND({bot}="${process.env.SERVICE_ACCOUNT_PROJECT_ID}",{completed}=0)`
        const exists = await base('unknowns').select({ filterByFormula: filter }).all()
        return exists.map(t => {
            return {...t.fields, id: t.id}
        })
    } catch (error){
        console.log(error)
    }
}
export const getBotIntentId = async (bot: string, intentName: string): Promise<string> => {
    try {
        const filter = `AND({bot}="${bot}",{intent_name}="${intentName}")`
        const exists = await base('responses').select({ filterByFormula: filter }).firstPage()
        return exists.length ? exists[0].getId() : ''
    } catch (error){
        console.log(error)
    }
}
export const updateBotResponses = async (intents: JSONIntent[]) => {
    if (intents.length){
        const bot = intents[0].bot
        // remove all current responses for the bot
        await removeBotResponses(bot)
        console.log('Removed bot responses')
        await Promise.all(chunk(intents, 10).map(t => base('responses').create(t.map(r => {
            return {fields: {...r, user_says: r.user_says.join('|'), bot_says: r.bot_says.join('|')}}
        }))))
        return intents
    }
    return null
}
export const updateDBIntentId = async (bot: string, intentName: string, id: string) => {
    const existingId = await getBotIntentId(bot, intentName)
    if (existingId){
        await base('responses').update(existingId, {id})
    }
}

export const getBots = async () => {
    try {
        const exists = await base('bots').select().all()
        return exists.map(t => t.fields)
    } catch (error){
        console.log(error)
    }
}
export const getBot = async (id: string) => {
    try {
        const filter = `{bot}="${id}"`
        const exists = await base('bots').select({ filterByFormula: filter }).firstPage()
        return exists.length ? exists[0].fields : {}
    } catch (error){
        console.log(error)
    }
}
export const saveTopic = async (answer: string) => {
    const url = process.env.SERVICE_ACCOUNT_PROJECT_ID

    try {
        await base('troubling-topics').create([
            {
                'fields': { answer, url }
            }
        ])
    } catch (error){
        console.log(error)
    }
}

export const getCheatSheet = async () => {
    try {
        const ret = await base('cheatsheet').select({ sort: [{ field: 'Category' }] }).all()
        return ret.map(t => t.fields)
    } catch (error){
        console.log(error)
    }
}