import * as axios from 'axios'
export interface searchResult{
    Engine: string,
    AbstractSource: string,
    AbstractText: string,
    AbstractURL: string
}
export const search = async (q: string) : Promise<searchResult> => {
    let res = await axios.default.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`)
    console.log(res.data.Answer)
    if (res.data && res.status === 200 && res.data.AbstractText){
        return {
            Engine: 'DuckDuckGo',
            AbstractSource: res.data.AbstractSource,
            AbstractText: res.data.AbstractText,
            AbstractURL: res.data.AbstractURL
        }
    }

    // try google for answers.
    const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&answerCount=1&count=1`
    console.log('trying bing', {url})
    res = await axios.default.get(url, {headers: { 'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_KEY}})
    console.log(res.data.webPages)
    if (res.data && res.status === 200 && (res.data.computation || res.data.webPages)){
        const txt = res.data.computation ?
            res.data.computation.value : res.data.webPages.value[0].snippet
        return {
            Engine: 'Bing',
            AbstractText: txt,
            AbstractURL: res.data.webPages ? res.data.webPages.value[0].displayUrl : '',
            AbstractSource: 'The Web'
        }
    }
    return undefined
}