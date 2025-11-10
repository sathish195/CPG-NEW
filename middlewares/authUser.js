const redis = require("../helpers/redis")
const telegram = require("../helpers/telegram")

module.exports = async (req, res, next) => {
    try {
        // get user
        const user = await redis.hGet("cpg_users", req.member.email, "User", { email: req.member.email })
        if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again!")
        if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Contact Admin")

        // assign to req.user
        req.user = user

        next()
    }catch(err) {
        telegram.alertDev(`❌❌❌❌❌❌ \n err in route CPG 👉🏻👉🏻👉🏻 ${req.originalUrl} \n\n ${err.stack}  \n ❌❌❌❌❌❌`)
        return res.status(500).send("Something Went Wrong! Please Try Login Again")
    }
}