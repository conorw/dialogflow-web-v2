/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { getBotUnknowns } from '../../../../common/airtable'
import { setCORSHeaders } from '../../../../common/utils'

export default async (req: NowRequest, res: NowResponse) => {
    res = setCORSHeaders(res)
    /* On GET request return the information about the agent */
    if (req.method == 'GET'){
        try {
            const sorted = await getBotUnknowns()
            res.writeHead(200, {
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify(sorted))
        } catch (error){
            res.statusCode = 500
            res.send(error.message)
        }
    } else if (req.method == 'OPTIONS'){
        /* Pass pre-flight HTTP check */
        res.send(200)
    } else {
        /* Send 404 on undefined method */
        res.send(404)
    }
}
