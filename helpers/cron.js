const cron = require('node-cron')
const cronJobs = require('./cronJobs')

cron.schedule('0 * * * *', cronJobs.updatePendingTransactions)