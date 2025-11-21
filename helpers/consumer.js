const bullMQ = require('bullmq');
const telegram = require('./telegram');
const { crypto_withdaw,admin_crypto_withdrawal_approve } = require('./processJobs');

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
        console.log("data---->");
        await admin_crypto_withdrawal_approve(job)
    }



}

const worker = new bullMQ.Worker('cpg_queue', async(job) => {
    console.log(job.data);
    if(job.data.type) await handleJobs[job.data.type](job)
}, { connection, limiter: { max: 1, duration: 1200 } })

// Listen for completed jobs
worker.on('completed', job => {
    telegram.alertDev(`Job ${job.data.type} completed`);
});

// Listen for failed jobs
worker.on('failed', (job, err) => {
    telegram.alertDev(`Job ${job.data.type} failed with error: ${err.message}`);
});