// const mongoose = require('mongoose')
// const telegram = require('./telegram')

// // get node environment
// const nodeEnv = process.env.NODE_ENV // staging or production

// // function for db connection
// const db = async () => {
//     try {
//         const { connection } = await mongoose.connect(process.env.DB_CONNECTION_STRING)
//         console.log('Database -->', connection.name)
//         mongoose.connection.on('open', () => {
//             gfs = Grid(mongoose.connection.db, mongoose.mongo)
//             gfs.collection('uploads')
//             console.log('MongoDB connected, GridFS ready')
//         })
        
//     }catch(err) {
//         telegram.alertDev(`${err}`)
//     }
// }

// module.exports = async (app, PORT) => {
//     db().then(() => {
//         app.listen(PORT, () => {
//             console.log('Server -->', PORT)
//             console.log('Environment -->', nodeEnv)
//         }) // server
//         require('./redis') // redis
//         require('./routes')(app) // routes
//         require('../helpers/consumer') // bullmq jobs
//         if(nodeEnv === 'production') require('../helpers/cron') // cron jobs
//     })
// }



const mongoose = require('mongoose')
const telegram = require('./telegram')
const Grid = require('gridfs-stream')

// Node environment
const nodeEnv = process.env.NODE_ENV // staging or production

// Global variable for GridFS
let gfs

// function for db connection
const db = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.DB_CONNECTION_STRING)
        console.log('Database -->', connection.name)

        // Initialize GridFS immediately — no need for 'open' event
        gfs = Grid(connection.db, mongoose.mongo)
        gfs.collection('uploads')
        console.log('MongoDB connected, GridFS ready')

    } catch (err) {
        telegram.alertDev(`${err}`)
        console.error('MongoDB connection error:', err)
    }
}

// Getter to access gfs in routes
const getGfs = () => {
    if (!gfs) throw new Error('GridFS not initialized yet')
    return gfs
}

module.exports = async (app, PORT) => {
    await db() // wait for DB connection

    // Start server
    app.listen(PORT, () => {
        console.log('Server -->', PORT)
        console.log('Environment -->', nodeEnv)
    })

    // Load other modules
    require('./redis') // redis
    require('./routes')(app) // routes
    require('../helpers/consumer') // bullmq jobs
    if (nodeEnv === 'production') require('../helpers/cron') // cron jobs
}

// Export getter for routes
module.exports.getGfs = getGfs
