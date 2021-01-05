const express = require('express')
const axios = require('axios')
const redis = require('redis')
const responseTime = require('response-time')
const app = express()

const {promisify}=require('util')
const client = redis.createClient({
    host:'127.0.0.1',
    port:6379
})
const GET_ASYNC=promisify(client.get).bind(client)
const SET_ASYNC=promisify(client.set).bind(client)
app.use(responseTime())

app.get('/rockets',async(req, res, next)=>{
    try {
        const reply = await GET_ASYNC('rockets')
        if(reply){
            console.log('using cached data')
            res.send(JSON.parse(reply))
            return
        }
        const resp = await axios.get('https://api.spacexdata.com/v3/rockets')
        const saveResult = await SET_ASYNC('rockets',JSON.stringify(resp.data),'EX',5)
        console.log('new data cached',saveResult)
        res.send(resp.data)
    } catch (error) {
        res.send(error)
    }
})

app.get('/rockets/:rocket_id',async(req,res,next)=>{
    try {
        const {rocket_id}=req.params;
        const reply = await GET_ASYNC(rocket_id)
        if(reply){
            console.log('using cached data')
            res.send(JSON.parse(reply))
            return
        }
        const resp = await axios.get(`https://api.spacexdata.com/v3/rockets/${rocket_id}`)
        const saveResult = await SET_ASYNC(rocket_id,JSON.stringify(resp.data),'EX',5)
        console.log('new data cached',saveResult)
        res.send(resp.data)
    } catch (error) {
        res.send(error)
    }
})

app.listen(5069, () => {
    console.log("rocket API running on port 5069")
})