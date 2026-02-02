const express = require('express')
require('dotenv').config()
require('./helpers/errorHandler')
const dbConnect = require('./helpers/dbConnect')

const app = express()

require('./helpers/appConfig')(app) 
require('./helpers/middlewares')(app, express) 
// require('./helpers/corn')

// // (async () => {
//   const results = await set("CPG_ALL_CRONS",true)

// // })();

dbConnect(app, 8080)