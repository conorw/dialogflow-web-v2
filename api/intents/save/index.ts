/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { JSONIntent, updateSingleIntent } from '../../../common/dialogflow'
import { setCORSHeaders } from '../../../common/utils'

export default async (req: NowRequest, res: NowResponse) => {
    res = setCORSHeaders(res)
    /* On GET request return the information about the agent */
    // curl -d @export.json -H "Content-Type: application/json" http://127.0.0.1:3000/api/intents/import
    if (req.method == 'POST'){
        try {
            const sorted: JSONIntent = req.body
            await updateSingleIntent(sorted)
            console.log('SORTED', {sorted})
            res.send(sorted)
        } catch (error){
            console.log(error)
            res.status(500).send(error)
        }
    } else if (req.method == 'OPTIONS'){
        /* Pass pre-flight HTTP check */
        res.send(200)
    } else {
        /* Send 404 on undefined method */
        res.send(404)
    }
}
