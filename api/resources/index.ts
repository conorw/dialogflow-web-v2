/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { getResources } from '../../common/airtable'
import { setCORSHeaders } from '../../common/utils'


export default async (req: NowRequest, res: NowResponse) => {
    res = setCORSHeaders(res)
    /* On GET request return the information about the agent */
    if (req.method == 'GET'){
        try {
            const bots = await getResources()
            res.send(bots)
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
