const express = require('express')
const dotenv = require('dotenv')
const app = express()
const bedrockRoutes = require('./routes/bedrockRoutes')
dotenv.config()

PORT = process.env.PORT




app.use("/bedrock" , bedrockRoutes)


app.listen(PORT , ()=>{
    console.log(`app is running on ${PORT}`)
})

