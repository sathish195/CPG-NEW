const express = require('express')
require('dotenv').config()
require('./helpers/errorHandler')
const dbConnect = require('./helpers/dbConnect')

const app = express()

require('./helpers/appConfig')(app) // configurations
require('./helpers/middlewares')(app, express) // middlewares
require('./helpers/corn')

// (async () => {
//   const results = await set("cpg_eth_block",74792899)
// })();

dbConnect(app, 8080)