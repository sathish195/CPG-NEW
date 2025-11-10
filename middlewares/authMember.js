const redis = require("../helpers/redis")
const telegram = require("../helpers/telegram")

module.exports = async (req, res, next) => {
    try {
        // configure key and collection
        const key = req.member.isAdmin ? "cpg_admins" : "cpg_users"
        const collection = req.member.isAdmin ? "Admin" : "User"

        // get member
        const member = await redis.hGet(key, req.member.email, collection, { email: req.member.email })
        if(!member) return res.status(400).send("No Account Found With Your Email. Please Re-Login And Try Again!")
        if(member.status !== "ACTIVE") return res.status(401).send("Something Went Wrong! Contact Admin")

        // assign to req.member
        req.member = member

        next()
    }catch(err) {
        telegram.alertDev(`❌❌❌❌❌❌ \n err in route CPG 👉🏻👉🏻👉🏻 ${req.originalUrl} \n\n ${err.stack}  \n ❌❌❌❌❌❌`)
        return res.status(500).send("Something Went Wrong! Please Try Login Again")
    }
}