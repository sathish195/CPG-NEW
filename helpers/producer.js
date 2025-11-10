const bullMQ = require('bullmq')
const telegram = require('./telegram')

const connection = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASS
}

const myQueue = new bullMQ.Queue('cpg_queue', { connection })

module.exports = {
    addJob: async (data) => {
        try {
            const job = await myQueue.add('cpg_job', data, { removeOnComplete: true })
            return job
        }catch(err) {
            telegram.alertDev(`❌❌❌❌❌❌ \n ${err.stack} \n ❌❌❌❌❌❌`)
        }
    }
}