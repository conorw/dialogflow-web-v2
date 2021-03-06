/* eslint-disable no-param-reassign */
import { NowRequest, NowResponse } from '@vercel/node'
import { setCORSHeaders } from '../../common/utils'
const giphy = require('giphy-api')(process.env.GIPHY_KEY)

export default async (req: NowRequest, res: NowResponse) => {
    let limit = req.query.limit || 4
    if (limit > 10){
        limit = 4
    }
    res = setCORSHeaders(res)
    /* On GET request return the information about the agent */
    if (req.method == 'GET'){
        try {
            const ret = await giphy.search({
                api: req.query.api || 'stickers',
                rating: 'pg',
                q: req.query.q,
                limit
            })
            res.send(ret)
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
