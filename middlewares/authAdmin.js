const redis = require("../helpers/redis")
const telegram = require("../helpers/telegram")

module.exports = async (req, res, next) => {
    try {
        // get admin
        const admin = await redis.hGet("cpg_admins", req.member.email, "Admin", { email: req.member.email })
        if(!admin) return res.status(400).send("No Account Found With Your Email. Please Re-Login And Try Again!")
        if(admin.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Contact Admin")
// console.log(admin,"admin");
        // assign to req.admin
        req.admin = admin

        next()
    }catch(err) {
        telegram.alertDev(`❌❌❌❌❌❌ \n err in route CPG 👉🏻👉🏻👉🏻 ${req.originalUrl} \n\n ${err.stack}  \n ❌❌❌❌❌❌`)
        return res.status(500).send("Something Went Wrong! Please Try Login Again")
    }
}