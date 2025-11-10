const mongoose = require('mongoose')
const telegram = require('./telegram')

// get node environment
const nodeEnv = process.env.NODE_ENV // staging or production

// function for db connection
const db = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.DB_CONNECTION_STRING)
        console.log('Database -->', connection.name)
    }catch(err) {
        telegram.alertDev(`${err}`)
    }
}

module.exports = async (app, PORT) => {
    db().then(() => {
        app.listen(PORT, () => {
            console.log('Server -->', PORT)
            console.log('Environment -->', nodeEnv)
        }) // server
        require('./redis') // redis
        require('./routes')(app) // routes
        require('../helpers/consumer') // bullmq jobs
        if(nodeEnv === 'production') require('../helpers/cron') // cron jobs
    })
}