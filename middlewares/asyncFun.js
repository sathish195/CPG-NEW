const telegram = require("../helpers/telegram")

module.exports = (handler) => {
    return async function(req, res, next) {
        try {
            await handler(req, res)
        }catch(err) {
            telegram.alertDev(`❌❌❌❌❌❌ \n err in route CPG 👉🏻👉🏻👉🏻 ${req.originalUrl} \n\n ${err.stack}  \n ❌❌❌❌❌❌`)
            next(err)
        }
    }
}