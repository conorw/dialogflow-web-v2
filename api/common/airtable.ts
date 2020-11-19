
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
