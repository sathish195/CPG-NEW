const telegram = require("./telegram")

process.on('uncaughtException', (err) => {
    telegram.alertDev(`❌❌❌❌❌❌ \n Uncaught Exception -->, ${err} \n ❌❌❌❌❌❌`)
})

process.on('unhandledRejection', (err) => {
    telegram.alertDev(`❌❌❌❌❌❌ \n Unhandled Rejection -->, ${err} \n ❌❌❌❌❌❌`)
})