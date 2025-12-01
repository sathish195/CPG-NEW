const bullMQ = require('bullmq');
const telegram = require('./telegram');
const { crypto_withdaw,admin_crypto_withdrawal_approve,crypto_deposite,cryptoo_settlement } = require('./processJobs');

const connection = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASS
}

const handleJobs = {
    cryptoWithdraw: async (job) => {
        await crypto_withdaw(job)
    },


    AdminApproveCryptoWithdraw: async (job) => {
        console.log("dataddddd---->");
        await admin_crypto_withdrawal_approve(job)
    }
    ,
    CRYPTO_DEPOSITS: async (job) => {
        console.log("data------ddddd---->");
        await crypto_deposite(job)
    },
    DEPOSIT_SETTLEMENT: async (job) => {
        // console.log("dataddddd---->");
        await cryptoo_settlement(job)
    }



}

const worker = new bullMQ.Worker('cpg_queue', async(job) => {
    // console.log(job,"------------------------------>");
    if(job.data.type) await handleJobs[job.data.type](job)
}, { connection, limiter: { max: 1, duration: 1200 } })

// Listen for completed jobs
worker.on('completed', job => {
    telegram.alertDev(`Job ${job.data.type} completed`);
    return true; 
});

// Listen for failed jobs
worker.on('failed', (job, err) => {
    telegram.alertDev(`Job ${job.data.type} failed with error: ${err.message}`);
});