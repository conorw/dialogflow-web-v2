
import Airtable from 'airtable'

const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE)

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
        const exists = await base('progress').select({filterByFormula: filter}).all()
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
        const exists = await base('progress').select({filterByFormula: filter, sort: [{field: 'UpdateDate'}]}).all()
        return exists.map(t => t.fields)
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
        const ret = await base('cheatsheet').select({sort: [{field: 'Category'}]}).all()
        return ret.map(t => t.fields)
    } catch (error){
        console.log(error)
    }
}