const cryptojs = require("../helpers/cryptojs")
const jwt = require("../helpers/jwt")
const telegram = require("../helpers/telegram")

module.exports = async (req, res, next) => {
    try {
        // get token
        const token_enc = req.header('x-auth-token')
        if(!token_enc) return res.status(401).send('Access Denied. No Token Provided!')

        // decrypt token
        const token = cryptojs.decryptObj(token_enc)
        if(token === 'tberror') return res.status(400).send("Invalid Token. Please Re-Login And Try Again")

        // decode token
        const decoded = jwt.decode(token)
        if(!decoded) return res.status(400).send("Invalid Token! Please Re-Login And Try Again")

        // check expire time
        const expirationTime = decoded.exp;
        const currentTime = Math.floor(Date.now() / 1000);
        if(expirationTime < currentTime) return res.status(401).send("Session Expired! Please Try Login Again")

        // get member
        const member = jwt.verify(token)

        // assign to req.member
        req.member = member

        next() // proceed to move
    }catch(err) {
        telegram.alertDev(`❌❌❌❌❌❌ \n err in route CPG 👉🏻👉🏻👉🏻 ${req.originalUrl} \n\n ${err.stack}  \n ❌❌❌❌❌❌`)
        return res.status(500).send("Something Went Wrong! Please Try Login Again")
    }
}