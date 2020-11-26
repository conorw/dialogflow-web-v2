import * as axios from 'axios'
export interface searchResult{
    Engine: string
    AbstractSource: string
    AbstractText: string
    AbstractURL: string
}
export const search = async (q: string) : Promise<searchResult> => {
    const res = await axios.default.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`)
    console.log(res)
    if (res.data && res.status === 200 && res.data.AbstractText){
        return {
            Engine: 'DuckDuckGo',
            AbstractSource: res.data.AbstractSource,
            AbstractText: res.data.AbstractText,
            AbstractURL: res.data.AbstractURL
        }
    }
    return undefined
}