const express = require('express')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const tfa = require('speakeasy')
const asyncFun = require('../../middlewares/asyncFun')
const validations = require('../../helpers/validations')
const cryptojs = require('../../helpers/cryptojs')
const mongoFunctions = require('../../helpers/mongoFunctions')
const redis = require('../../helpers/redis')
const tigerBalm = require('../../helpers/tigerBalm')
const auth = require('../../middlewares/auth')
const recaptcha = require('../../middlewares/recaptcha')
const rateLimitter = require('../../helpers/rateLimitter')
const authUser = require('../../middlewares/authUser')
const producer = require('../../helpers/producer')
const telegram = require('../../helpers/telegram')
const controllers = require('../../helpers/controllers')
const slowDownLimitter = require('../../helpers/slowDownLimitter')
const {address_generate} =require("../../helpers/genCryptoAddress")

const user = express.Router()

// generate and get app key
async function getAppKey() {
    // generate app key
    const appKey =await cryptojs.generateRandomString(15)

    // check key in db
    let appKeyExists = await mongoFunctions.findOne("User", { 'keys.appKey': appKey })

    // if app key exits::regenerate and check in db with new app key
    if(appKeyExists) return await getAppKey()

    // return app key
    return appKey
}

// @METHOD: POST
// @ROUTE: /api/user/register
// @DESC: To register new user
user.post('/register', slowDownLimitter, rateLimitter, recaptcha, asyncFun (async (req, res) => {
    // get admin controls
    const adminControls = await redis.hGet("cpg_admin", "controls", "AdminControls", { })
    if(!adminControls) return res.status(401).send("Admin Controls Not Added")
    if(adminControls.register !== "ENABLE") return res.status(401).send("Admin Has Disabled User Registration. Please Try Again After Some Time")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.registerUser(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // validate username and email
    // let userExists = await mongoFunctions.findOne("User", { userName: payload.userName })
    // if(userExists) return res.status(400).send("Username Already Exists")
    const userExists = await mongoFunctions.findOne("User", { email: payload.email })
    if(userExists) return res.status(400).send("Email Already Exists")

    // check if userName or email exists in admin
    // let adminExists = await mongoFunctions.findOne("Admin", { userName: payload.userName })
    // if(adminExists) return res.status(400).send("Username Already Exists")
    const adminExists = await mongoFunctions.findOne("Admin", { email: payload.email })
    if(adminExists) return res.status(400).send("Email Already Exists")

    // referral id validations
    if(payload.referralId) {
        const referralId_valid = await mongoFunctions.findOne("User", { userId: payload.referralId })
        if(!referralId_valid) return res.status(400).send("Invalid Referral Id. Please Try Again")
    }

    // hash password
    const salt = await bcrypt.genSalt(10)
    payload.password = await bcrypt.hash(payload.password, salt)
    // create user
    const coins = adminControls.coins
    const balances = []
    const merchantFee = {type:"FLAT", value:0} 
    // const merchantFee = {type : "PERCENTAGE", value : 0}
    const userData = {
        userId: 'CPG'+await cryptojs.generateRandomString(),
        ...payload,
        status: "PENDING",
        balances,
        merchantFee,
        referralId: payload.referralId || "0",
        auth: ['self'] 
    }
    const user = await mongoFunctions.create("User", userData)

    // send otp
    await redis.setEx(`cpg-register-otp-${user.email}`, '123456', '180')

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "OTP Sent To Email" }))
}))

// @METHOD: POST
// @ROUTE: /api/user/appKey
// @DESC: To generate app key for user
// user.post('/appKey', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
//     // get user
//     const user = await mongoFunctions.findOne("User", { email: req.user.email })
//     if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again");
//     if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

//     // get enc
//     const { error: payloadError } = validations.getEnc(req.body)
//     if(payloadError) return res.status(400).send(payloadError.details[0].message)

//     // decrypt payload
//     const payload =await cryptojs.decrypt(req.body.enc)
//     if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
//     if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

//     // validate payload
//     const { error } = validations.generateAppKey(payload)
//     if(error) return res.status(400).send(error.details[0].message)

//     // validate ip
//     // const ipExists = (user.whiteList_ip.filter(ip => ip === payload.ip))[0]
//     // if(!ipExists) return res.status(400).send("Add Your Current IP Into Whitelist To Generate App Key");

//     // check app keys
//     if(user.keys.length && user.keys.length >= 3) return res.status(400).send("Cannot Generate More Than 3 App Keys");

//     // check app name
//     const appNameExists = user.keys.filter(key => key.appName.toLowerCase() === payload.appName.toLowerCase())[0]
//     if(appNameExists) return res.status(400).send("App Name Already Exists");

//     // generate key
//     const appKey = await getAppKey()
//     let secretKey ={ email: user.email, appName: payload.appName }
    
//     const appId ={ userId: user.userId, successUrl: payload.successUrl, notifyUrl: payload.notifyUrl }
//     const whiteList_ip = [payload.whiteList_ip]
//     // const key = {
//     //     appId: tigerBalm.encrypt(appId),
//     //     appKey: tigerBalm.encrypt(appKey),
//     //     secretKey: tigerBalm.encrypt(secretKey),
//     //     appName: payload.appName,
//     //     successUrl: payload.successUrl,
//     //     notifyUrl: payload.notifyUrl,
//     //     whiteList_ip
//     // }
//     const key = {
//         appId: tigerBalm.encrypt(JSON.stringify(appId)), // Make sure it's a string
//         appKey: tigerBalm.encrypt(appKey), // Serialize the appKey if it's an object
//         secretKey: tigerBalm.encrypt(JSON.stringify(secretKey)), // Serialize secretKey
//         appName: payload.appName,
//         successUrl: payload.successUrl,
//         notifyUrl: payload.notifyUrl,
//         whiteList_ip
//     }
    
//     // update user
//     const update = {
//         $push: { keys: key },
//         ip: payload.ip,
//         browserId: payload.browserId,
//     }
//     const updatedUser = await mongoFunctions.findOneAndUpdate("User", { email: user.email }, update, { new: true });
//     await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))
//     secretKey = await cryptojs.encrypt(secretKey)

//     return res.status(200).send(await cryptojs.encrypt({ appKey, secretKey, whiteList_ip }))
// }))

// // @METHOD: POST
// // @ROUTE: /api/user/updateAppKey
// // @DESC: To update app key
// user.post('/updateAppKey', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
//     // get user
//     const user = await mongoFunctions.findOne("User", { email: req.user.email });
//     if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
//     if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

//     // get enc
//     const { error: payloadError } = validations.getEnc(req.body)
//     if(payloadError) return res.status(400).send(payloadError.details[0].message)

//     // decrypt payload
//     const payload =await cryptojs.decrypt(req.body.enc)
//     if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
//     if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty");

//     // validate payload
//     const { error } = validations.updateAppKey(payload)
//     if(error) return res.status(400).send(error.details[0].message);

//     // validate ip
//     // const ipExists = (user.whiteList_ip.filter(ip => ip === payload.ip))[0]
//     // if(!ipExists) return res.status(400).send("Add Your Current IP Into Whitelist To Update App Key");

//     // encrypt app key
//     const appKey_enc = tigerBalm.encrypt(payload.appKey)

//     // get app key
//     const currentKey = user.keys.filter(key => key.appKey === appKey_enc)[0]
//     if(!currentKey) return res.status(400).send("No App Key Found");

//     // configure update key
//     const update = {
//         $set: { }
//     }
//     if(payload.successUrl && payload.successUrl !== currentKey.successUrl) {
//         update['$set']['keys.$.successUrl'] = payload.successUrl
//     }
//     if(payload.notifyUrl && payload.notifyUrl !== currentKey.notifyUrl) {
//         update['$set']['keys.$.notifyUrl'] = payload.notifyUrl
//     }
//     if(payload.whiteList_ip && !currentKey.whiteList_ip.includes(payload.whiteList_ip)) {
//         const whiteList_ip = currentKey.whiteList_ip
//         if(whiteList_ip.length >= 3) whiteList_ip.pop()
//         whiteList_ip.unshift(payload.whiteList_ip)
//         update['$set']['keys.$.whiteList_ip'] = whiteList_ip
//     }

//     // update app key
//     if(Object.keys(update['$set']).length) {
//         // generate new app Id
//         const appId ={ userId: user.userId, successUrl: payload.successUrl, notifyUrl: payload.notifyUrl }
//         update['$set']['keys.$.appId'] = tigerBalm.encrypt(JSON.stringify(appId))

//         // update user
//         const filter = { 'keys.appKey': appKey_enc }
//         update['ip'] = payload.ip
//         update['browserId'] = payload.browserId
//         const updatedUser = await mongoFunctions.findOneAndUpdate("User", filter, update, { new: true })
//         await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))
//     }

//     return res.status(200).send(await cryptojs.encrypt({ message: "App Key Updated Successfully" }))
// }))

// // @METHOD: POST
// // @ROUTE: /api/user/deleteAppKey
// // @DESC: To delete app key
// user.post('/deleteAppKey', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
//     // get user
//     const user = await mongoFunctions.findOne("User", { email: req.user.email });
//     if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
//     if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

//     // get enc
//     const { error: payloadError } = validations.getEnc(req.body)
//     if(payloadError) return res.status(400).send(payloadError.details[0].message)

//     // decrypt payload
//     const payload =await cryptojs.decrypt(req.body.enc)
//     if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
//     if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

//     // validate payload
//     const { error } = validations.deleteAppKey(payload)
//     if(error) return res.status(400).send(error.details[0].message);

//     // encrypt app key
//     const appKey_enc = tigerBalm.encrypt(payload.appKey)

//     // get app key
//     const currentKey = user.keys.filter(key => key.appKey === appKey_enc)[0]
//     if(!currentKey) return res.status(400).send("No App Key Found");

//     // delete app key
//     const filter = { 'keys.appKey': appKey_enc }
//     const update = {
//         $pull: {
//             keys: { appKey: appKey_enc }
//         },
//         ip: payload.ip,
//         browserId: payload.browserId
//     }
//     const updatedUser = await mongoFunctions.findOneAndUpdate("User", filter, update, { new: true })
//     await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))

//     return res.status(200).send(await cryptojs.encrypt({ message: "App Key Deleted Successfully" }))
// }))


// @METHOD: POST
// @ROUTE: /api/user/appKey
// @DESC: To generate app key for user
user.post('/appKey', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email })
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again");
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.generateAppKey(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // validate ip
    // const ipExists = (user.whiteList_ip.filter(ip => ip === payload.ip))[0]
    // if(!ipExists) return res.status(400).send("Add Your Current IP Into Whitelist To Generate App Key");

    // check app keys
    if(user.keys.length && user.keys.length >= 3) return res.status(400).send("Cannot Generate More Than 3 App Keys");

    // check app name
    const appNameExists = user.keys.filter(key => key.appName.toLowerCase() === payload.appName.toLowerCase())[0]
    if(appNameExists) return res.status(400).send("App Name Already Exists");

    // generate key
    const appKey = await getAppKey()
    const secretKey =await cryptojs.encrypt({ email: user.email, appName: payload.appName })
    const appId =await cryptojs.encrypt({ userId: user.userId, successUrl: payload.successUrl, notifyUrl: payload.notifyUrl })
    const whiteList_ip = [payload.whiteList_ip]
    const key = {
        appId: tigerBalm.encrypt(appId),
        appKey: tigerBalm.encrypt(appKey),
        secretKey: tigerBalm.encrypt(secretKey),
        appName: payload.appName,
        successUrl: payload.successUrl,
        notifyUrl: payload.notifyUrl,
        whiteList_ip
    }
    
    // update user
    const update = {
        $push: { keys: key },
        ip: payload.ip,
        browserId: payload.browserId,
    }
    const updatedUser = await mongoFunctions.findOneAndUpdate("User", { email: user.email }, update, { new: true });
    await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))

    return res.status(200).send(await cryptojs.encrypt({ appKey, secretKey, whiteList_ip }))
}))

// @METHOD: POST
// @ROUTE: /api/user/updateAppKey
// @DESC: To update app key
user.post('/updateAppKey', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email });
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty");

    // validate payload
    const { error } = validations.updateAppKey(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // validate ip
    // const ipExists = (user.whiteList_ip.filter(ip => ip === payload.ip))[0]
    // if(!ipExists) return res.status(400).send("Add Your Current IP Into Whitelist To Update App Key");

    // encrypt app key
    const appKey_enc = tigerBalm.encrypt(payload.appKey)

    // get app key
    const currentKey = user.keys.filter(key => key.appKey === appKey_enc)[0]
    if(!currentKey) return res.status(400).send("No App Key Found");

    // configure update key
    const update = {
        $set: { }
    }
    if(payload.successUrl && payload.successUrl !== currentKey.successUrl) {
        update['$set']['keys.$.successUrl'] = payload.successUrl
    }
    if(payload.notifyUrl && payload.notifyUrl !== currentKey.notifyUrl) {
        update['$set']['keys.$.notifyUrl'] = payload.notifyUrl
    }
    if(payload.whiteList_ip && !currentKey.whiteList_ip.includes(payload.whiteList_ip)) {
        const whiteList_ip = currentKey.whiteList_ip
        if(whiteList_ip.length >= 3) whiteList_ip.pop()
        whiteList_ip.unshift(payload.whiteList_ip)
        update['$set']['keys.$.whiteList_ip'] = whiteList_ip
    }

    // update app key
    if(Object.keys(update['$set']).length) {
        // generate new app Id
        const appId =await cryptojs.encrypt({ userId: user.userId, successUrl: payload.successUrl, notifyUrl: payload.notifyUrl })
        update['$set']['keys.$.appId'] = tigerBalm.encrypt(appId)

        // update user
        const filter = { 'keys.appKey': appKey_enc }
        update['ip'] = payload.ip
        update['browserId'] = payload.browserId
        const updatedUser = await mongoFunctions.findOneAndUpdate("User", filter, update, { new: true })
        await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))
    }

    return res.status(200).send(await cryptojs.encrypt({ message: "App Key Updated Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/user/deleteAppKey
// @DESC: To delete app key
user.post('/deleteAppKey', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email });
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.deleteAppKey(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // encrypt app key
    const appKey_enc = tigerBalm.encrypt(payload.appKey)

    // get app key
    const currentKey = user.keys.filter(key => key.appKey === appKey_enc)[0]
    if(!currentKey) return res.status(400).send("No App Key Found");

    // delete app key
    const filter = { 'keys.appKey': appKey_enc }
    const update = {
        $pull: {
            keys: { appKey: appKey_enc }
        },
        ip: payload.ip,
        browserId: payload.browserId
    }
    const updatedUser = await mongoFunctions.findOneAndUpdate("User", filter, update, { new: true })
    await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))

    return res.status(200).send(await cryptojs.encrypt({ message: "App Key Deleted Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/user/addIp
// @DESC: To add ip to whitelist
user.post('/addIp', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email });
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.addWhiteListIp(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // update whitelist ip
    let whiteList_ip = user.whiteList_ip
    // check whiteListIp in whiteList_ip array
    const whiteListIpExists = (whiteList_ip.filter(ip => ip === payload.whiteListIp))[0]
    if(!whiteListIpExists) {
        whiteList_ip.splice(0, 0, payload.whiteListIp)
        if(whiteList_ip.length > 5) whiteList_ip.length = 5 // first 5 ip
    }

    // update user
    const update = { whiteList_ip, ip: payload.ip, browserId: payload.browserId }
    const updatedUser = await mongoFunctions.findOneAndUpdate("User", { email: user.email }, update, { new: true })
    await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "IP Added Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/user/getKeys
// @DESC: To get api keys for user
user.post('/getKeys', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email });
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

    // get keys
    let keys = user.keys
    if(!keys.length) return res.status(200).send(await cryptojs.encrypt([]));

    // decrypt keys
    keys = keys.map(key => {
        return {
            appKey: tigerBalm.decrypt(key.appKey),
            appName: key.appName,
            successUrl: key.successUrl,
            notifyUrl: key.notifyUrl,
        }
    })
console.log(keys,"----------enc--------->");

const enc = await cryptojs.encrypt(keys);
const dec =await cryptojs.decrypt(enc);
console.log(dec,"----------dec--------->");
    return res.status(200).send(await cryptojs.encrypt(keys))
}))

// @METHOD: POST
// @ROUTE: /api/user/getProfile
// @DESC: To get profile details for user
user.post('/getProfile', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const { user } = req
    
    // create response object
    // const response = _.pick(user, ['userId', 'userName', 'email', 'withdrawStatus', 'transactionStatus','tfaStatus'])
    // console.log(user,"user in getProfile");

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt(user))
}))

// @METHOD: POST
// @ROUTE: /api/user/riseTicket
// @DESC: To get support by rising ticket
user.post('/riseTicket', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const { user } = req

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.riseTicket(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // create ticket
    const ticketData = {
        ticketId:await cryptojs.generateRandomString(),
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        // title: payload.title,
        messages: [
            {
                msgId:await cryptojs.generateRandomString(),
                personId: user.userId,
                personName: user.userName,
                personEmail: user.email,
                message: payload.message,
                dateTime: new Date()
            }
        ]
    }
    const ticket = await mongoFunctions.create("Ticket", ticketData)

    // alert dev
    telegram.alertDev(`🚨 New ticket rised 🚨 %0A
	ticket id --> ${ticket.ticketId} %0A
	rised by --> ${user.email} %0A
	status --> ${ticket.status} ${ticket.status === "OPEN" ? '🛑' : '🟢'}`)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "Your Support Request Has Been Submitted Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/user/replyTicket
// @DESC: To send reply in ticket
user.post('/replyTicket', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const { user } = req

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.replyTicket(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get ticket
    const filter = { ticketId: payload.ticketId }
    const ticket = await mongoFunctions.findOne("Ticket", filter)
    if(!ticket) return res.status(400).send("No Ticket Found With Given Ticket ID. Please Try Again")
    if(ticket.status === "CLOSED") return res.status(400).send("Ticket Has Closed")

    // update ticket
    const update = {
        $push: {
            messages: {
                msgId:await cryptojs.generateRandomString(),
                personId: user.userId,
                personName: user.userName,
                personEmail: user.email,
                message: payload.message,
                dateTime: new Date()
            }
        }
    }
    const updatedTicket = await mongoFunctions.findOneAndUpdate("Ticket", { ticketId: ticket.ticketId }, update, { new: true })

    // alert dev
    telegram.alertDev(`🚨🔧 Ticket updated 🔧🚨 %0A
	✍️ User replied to ticket ✍️ %0A
	ticket id --> ${updatedTicket.ticketId} %0A
	rised by --> ${user.email} %0A
	status --> ${updatedTicket.status} ${updatedTicket.status === "OPEN" ? '🛑' : '🟢'}`)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "Message Sent Successfully", ticket: updatedTicket }))
}))

// @METHOD: POST
// @ROUTE: /api/user/updateSettlement
// @DESC: To update settlement process of balance
user.post('/updateSettlement', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email });
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty");
    console.log("payload -->", payload)

    // validate payload
    const { error } = validations.updateSettlement(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // validate otp
    console.log("otp key --->", `cpg-settlement-otp-${user.email}`)
    const otp = await redis.get(`cpg-settlement-otp-${user.email}`)
    if(!otp) return res.status(400).send("OTP Expired. Please Try Resend OTP")
    if(otp !== payload.otp) return res.status(400).send("Incorrect OTP. Please Try Again")

    // verfiy 2fa
    if(user.tfaStatus === "ENABLE") {
        if(!payload.tfaCode) return res.status(400).send("2FA Code Is Required");

        // validate tfa key
        if(!user.tfaKey || user.tfaKey === "0") return res.status(400).send("No 2FA Key Found")

        // decrypt tfa key
        const tfaKey = tigerBalm.decrypt(user.tfaKey)

        // 2fa code validations
        const tfaResult = tfa.totp.verifyDelta({
            secret: tfaKey,
            encoding: 'base32',
            token: payload.tfaCode,
        });
        if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
        if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")
    }
    await redis.delete(`cpg-settlement-otp-${user.email}`) // delete otp

    // check coin
    const currentCoin = user.balances.filter(coin => coin.coinId === payload.coin)[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin Id");
    
    // update settlement
    const currentSettlement = currentCoin.settlement
    let updateSettlement = false
    if(payload.settlementType !== currentCoin.settlementType){
        updateSettlement = true
        currentSettlement.settlementType = payload.settlementType
    }
    if(payload.chain !== currentCoin.chain){
        updateSettlement = true
        currentSettlement.chain = payload.chain
    }
    if(payload.settlementIn !== currentCoin.settlementIn) {
        updateSettlement = true
        currentSettlement.settlementIn = payload.settlementIn
    }
    if(payload.address !== currentCoin.address) {
        updateSettlement = true
        currentSettlement.address = payload.address
    }
    if(payload.settlementStatus !== currentCoin.settlementStatus) {
        updateSettlement = true
        currentSettlement.settlementStatus = payload.settlementStatus
    }
    if(updateSettlement) {
        const update = {
            $set: {
                'balances.$.settlement': currentSettlement
            },
            ip: payload.ip,
            browserId: payload.browserId
        }
        const updatedUser = await mongoFunctions.findOneAndUpdate("User", { email: user.email, 'balances.coinId': payload.coin }, update, { new: true })
    }

    return res.status(200).send(await cryptojs.encrypt({ message: "Settlement Type Updated" }))
}))

// @METHOD: POST
// @ROUTE: /api/user/initWithdraw
// @DESC: To initiate withdraw to withdraw balance
user.post('/initWithdraw', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email });
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")
    if(user.withdrawStatus !== "ENABLE") return res.status(401).send("You're Not Allowed To Withdraw Balance. Contact Admin")

    // get admin controls
    const adminControls = await redis.hGet("cpg_admin", "controls", "AdminControls", { })
    if(adminControls.withdraw !== "ENABLE") return res.status(401).send("Admin Has Disabled Withdraw. Please Try After Some Time")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    console.log(payload,"------------------->");
    const { error } = validations.initiateWithdraw(payload)
    if(error) return res.status(400).send(error.details[0].message)
    console.log(payload,"------------------->");


    // requested amount
    let requestedAmount = Number(payload.amount)

    // check balance
    const userBalances = user.balances
    const currentCoinBalance = (userBalances.filter(balance => balance.coinId === payload.coin))[0]
    if(!currentCoinBalance) return res.status(400).send("No Such Coin Found In Your Account To Inititate Withdraw") // check current coin in balances
    if(currentCoinBalance?.balance < requestedAmount) return res.status(400).send("Insufficient Balance") // balance of coin in current coin balance

    // get current coin from admin controls
    const allCoins = adminControls.coins
    const currentCoin = (allCoins.filter(coin => coin.coinId === payload.coin))[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin Id");

    // get current chain
    const currentChain = currentCoin.chains.filter(chain => chain.chainId === payload.chain)[0]
    if(!currentChain) return res.status(400).send("No Chain Found With Given Chain Id");
    
    // coin & chain validations
    if(currentCoin?.coinStatus !== "ENABLE") return res.status(401).send("Admin Has Disabled This Coin. Please Try After Some Time");
    if(currentCoin?.withdraw?.withdrawStatus !== "ENABLE") return res.status(401).send("Admin Has Disabled Withdraw To This Coin. Please Try After Some Time")
    if(requestedAmount < currentCoin?.withdraw?.withdrawMin || requestedAmount > currentCoin?.withdraw?.withdrawMax) return res.status(400).send(`Withdrawal Amount Should Be Minimum: "${currentCoin?.withdraw?.withdrawMin}" And Maximum: "${currentCoin?.withdraw?.withdrawMax}"`)

    // fee calculations
    const totalFee_chain = currentChain?.fee
    const transactionAmount = requestedAmount - totalFee_chain
    if(transactionAmount <= 0) return res.status(400).send("Cannot Process This Amount. Amount Is Too Small")

    // create transaction
    const transactionData = {
        tId:await cryptojs.generateRandomString(15),
        type: "WITHDRAWAL",
        amount: requestedAmount,
        address: payload.address,
        ..._.pick(user, ['userId', 'userName', 'email']),
        ..._.pick(currentCoin, ['coinId', 'coinName', 'coinTicker']),
        ..._.pick(currentChain, ['chainId', 'chainName']),
        fee: totalFee_chain,
        status: "PENDING",
        comment: "PENDING"
        // comment: `Withdrawal from address "${payload.address}" with fee "${totalFee_chain}"`,
    }
    const transaction = await mongoFunctions.create("Transaction", transactionData)

    // create otp
    await redis.setEx(`cpg-withdraw-otp-${user.email}`, '123456', '180')
    const otp = await redis.get(`cpg-withdraw-otp-${user.email}`)


    // alert dev
    telegram.alertDev(`💵 Withdraw inititated 💵 %0A
	tId --> ${transaction.tId} %0A
	from --> ${user.email} %0A
	coin --> ${currentCoin.coinName} %0A
	amount --> ${payload.amount} %0A
	address --> ${payload.address}`)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "OTP Sent To Email", tId: transaction.tId }))
}))

// @METHOD: POST
// @ROUTE: /api/user/withdraw
// @DESC: To withdarw balance
user.post('/withdraw', auth, authUser, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const user = await mongoFunctions.findOne("User", { email: req.user.email });
    if(!user) return res.status(400).send("No Account Found. Please Re-Login And Try Again")
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed! Please Contact Admin")
    if(user.withdrawStatus !== "ENABLE") return res.status(401).send("You're Not Allowed To Withdraw Balance. Contact Admin")

    // get admin controls
    const adminControls = await redis.hGet("cpg_admin", "controls", "AdminControls", { })
    if(!adminControls) return res.status(401).send("Admin Controls Not Added")
    if(adminControls.withdraw !== "ENABLE") return res.status(401).send("Admin Has Disabled Withdraw. Please Try After Some Time")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    console.log(payload,"withdraw payload");
    const { error } = validations.withdrawBalance(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get transaction
    const transaction = await mongoFunctions.findOne("Transaction", { tId: payload.tId, userId: user.userId })
    if(!transaction) return res.status(400).send("No Transaction Found. Please Try Again")
    if(transaction.status === "FAILED") return res.status(400).send("Your Transaction Process Was Failed. Please Try Again")
    if(transaction.status === "COMPLETED") return res.status(400).send("Your Transaction Process Was Completed")
console.log(payload);
    // otp validations
    const otp = await redis.get(`cpg-withdraw-otp-${user.email}`)
    console.log(otp, payload.otp);
    if(!otp) return res.status(400).send("OTP Expired. Please Try Resend OTP")
    if(otp !== payload.otp) return res.status(400).send("Incorrect OTP. Please Try Again")

    // verfiy 2fa
    if(user.tfaStatus === "ENABLE") {
        if(!payload.tfaCode) return res.status(400).send("2FA Code Is Required");

        // validate tfa key
        if(!user.tfaKey || user.tfaKey === "0") return res.status(400).send("No 2FA Key Found")

        // decrypt tfa key
        const tfaKey = tigerBalm.decrypt(user.tfaKey)

        // 2fa code validations
        const tfaResult = tfa.totp.verifyDelta({
            secret: tfaKey,
            encoding: 'base32',
            token: payload.tfaCode,
        });
        if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
        if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")
    } 

    // withdraw balance
    await redis.delete(`cpg-withdraw-otp-${user.email}`) // delete otp

    await producer.addJob({ type: "cryptoWithdraw", tId: transaction.tId, userId: user.userId })

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ tId: transaction.tId }))
}))

// @METHOD: POST
// @ROUTE: /api/user/generateHash
// @DESC: To generate hash for checkout
user.post('/generateHash', slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get app key from headers
    const appKey = req.headers["x-app-key"]
    console.log(appKey,"appKey");
    if(!appKey) return res.status(400).send("App Key Is Required");

    // encrypt apiKey
    const appKey_enc = tigerBalm.encrypt(appKey)

    // get user
    const user = await mongoFunctions.findOne("User", { 'keys.appKey': appKey_enc })
    if(!user) return res.status(400).send("No User Found With Given App Key");
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed To Process This Request. Contact Admin");

    // app key validations
    const currentKey = user.keys.filter(key => key.appKey === appKey_enc)[0]
    console.log(currentKey,"currentKey");
    if(!currentKey || !currentKey?.appId) return res.status(400).send("Invalid App Key");
    const appId = tigerBalm.decrypt(currentKey.appId)
    if(!appId || appId === 'tberror') return re.status(400).send("Invalid App Key. Please Generate New App Key")
        console.log(appId,"app--------------Id");
    const appIdData =await cryptojs.jwt_decrypt(appId)
    // const appIdData =appId



console.log(appIdData,"appIdData");
    if(!appIdData || !Object.keys(appIdData).length) return res.status(400).send("No Data Found In Given App Key")

            // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // get payload
    // const payload = req.body
    console.log(req.body,"payload");
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Cannot Be Empty");

    // validate payload
    const { error } = validations.generateHash(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // requested amount
    const requestedAmount = Number(payload.amount)

    // check pending invoices
    const totalPendingInv = await mongoFunctions.countDocuments("Transaction", { type: "DEPOSIT", status: "PENDING" })
    if(totalPendingInv >= 50) return res.status(400).send("Pending Invoices Limit Reached. Please Try Again After Some Time")

    // validations
    const invExists = await mongoFunctions.findOne("Transaction", { userId: user.userId, invNo: payload.invNo })
    if(invExists) return res.status(400).send("Invoice Number Already Exists");

    // get coins
    const adminControls = await controllers.getAdminControls();
    const allCoins = adminControls.coins

    // coin validations
    const currentCoin = allCoins.filter(coin => coin.coinId === payload.coin)[0]
    if(!currentCoin) return res.status(400).send("No Such Coin Found In Admin Controls");
    if(currentCoin.coinStatus !== "ENABLE") return res.status(400).send("Admin Has Disabled This Coin. Please Try After Some Time");
    if(currentCoin?.deposit?.depositStatus !== "ENABLE") return res.status(401).send("Admin Has Disabled Deposit To This Coin. Please Try After Some Time")
    if(requestedAmount < currentCoin?.deposit?.depositMin || requestedAmount > currentCoin?.deposit?.depositMax) return res.status(400).send(`Deposit Amount Should Be Minimum: "${currentCoin?.deposit?.depositMin}" And Maximum: "${currentCoin?.deposit?.depositMax}"`)

    // chain validations
    const allChains = currentCoin.chains
    const currentChain = allChains.filter(chain => chain.chainId === payload.chain)[0]
    if(!currentChain) return res.status(400).send("No Such Chain Found For Selected Coin In Admin Controls");
    if(currentChain.chainStatus !== "ENABLE") return res.status(400).send("Admin Has Disabled This Chain. Please Try After Some Time");

    // fee validations
    const totalFee_chain = currentChain.fee
    if(totalFee_chain > requestedAmount) return res.status(400).send("Fee Is Greater Than Amount");

    // generate hash
    console.log(appIdData,"appIdData before hash");
    console.log(payload,"payload before hash");
    console.log(requestedAmount,"requestedAmount before hash");
    const timeNow = Date.now()
    const expireTime = timeNow + 30 * 60 * 1000 // 30min

    const data = {
        ...appIdData, // userId, successUrl & notifyUrl
        ...payload, // invNo, amount, coin, chain
        amount: requestedAmount,
        timestamp: Date.now(),
        expireTime,
        appName : currentKey.appName
    }    
    // console.log(data,"data to generate hash");
    // const secretKey = tigerBalm.decrypt(JSON.parse
    //     (currentKey.secretKey))
        const secretKey = tigerBalm.decrypt(currentKey.secretKey); 
// const secretKey = JSON.parse(decryptedSecretKey); // Only if the decrypted result is a JSON string

    const hash =await cryptojs.encrypt(data, secretKey)
    // const dhash =await cryptojs.decrypt(hash)
    // telegram.alertDev("generated hash data",dhash);

// console.log(dhash,"generated hash");
    return res.status(200).send({ hash  })
}))

// @METHOD: POST
// @ROUTE: /api/user/initCheckout
// @DESC: To initiate checkout for user
user.post('/initCheckout', slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get app key from headers
    const appKey = req.headers["x-app-key"]
    console.log(appKey,"--------------------------------------------------------------->");

    if(!appKey) return res.status(400).send("App Key Is Required");

    // encrypt apiKey
    const appKey_enc = tigerBalm.encrypt(appKey)

    // get user
    const user = await mongoFunctions.findOne("User", { 'keys.appKey': appKey_enc })
    if(!user) return res.status(400).send("No User Found With Given App Key");
    if(user.status !== "ACTIVE") return res.status(401).send("You're Not Allowed To Process This Request. Contact Admin");

    // app key validations
    const currentKey = user.keys.filter(key => key.appKey === appKey_enc)[0]
    if(!currentKey || !currentKey?.appId) return res.status(400).send("Invalid App Key");

    // get payload
    const payload = req.body
    console.log(payload,"payload");
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Cannot Be Empty");

    // check pending invoices
    const totalPendingInv = await mongoFunctions.countDocuments("Transaction", { type: "DEPOSIT", status: "FAILED" })
    if(totalPendingInv >= 50) return res.status(400).send("Pending Invoices Limit Reached")

    // validate payload
    const { error } = validations.validateHash(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // decrypt hash
    console.log(currentKey,"--------->currentKey");
    const secretKey = tigerBalm.decrypt(currentKey.secretKey)
    console.log(secretKey,"--------->secretKey");

    const hash_dec =await cryptojs.jwt_decrypt(payload.hash,secretKey)
    console.log(hash_dec,"--------->hash_dec");

    if(!hash_dec || hash_dec === 'tberror') return res.status(400).send("Invalid Hash");

    // hash key validations
    // const timeNow = Date.now()
    // const expireTime = hash_dec.timestamp + 30 * 60 * 1000 // 30min
    if(hash_dec.timestamp >= hash_dec.expireTime) return res.status(400).send("Hash Key Expired. Please Try Again");

    // check invoice
    // const invExists = await mongoFunctions.findOne("Transaction", { userId: user.userId, invNo: hash_dec.invNo })
    // if(invExists) return res.status(400).send("Invoice Number Already Exists");

    // get coins
    const adminControls = await controllers.getAdminControls();
    if(adminControls.deposit !== "ENABLE") return res.status(401).send("Admin Has Disabled Deposit. Please Try After Some Time")

    const allCoins = adminControls.coins

    // coin validations
    const currentCoin = allCoins.filter(coin => coin.coinId === hash_dec.coin)[0]
    if(!currentCoin) return res.status(400).send("No Such Coin Found In Admin Controls");
    if(currentCoin.coinStatus !== "ENABLE") return res.status(400).send("Admin Has Disabled This Coin. Please Try After Some Time");

    // chain validations
    const allChains = currentCoin.chains
    const currentChain = allChains.filter(chain => chain.chainId === hash_dec.chain)[0]
    if(!currentChain) return res.status(400).send("No Such Chain Found For Selected Coin In Admin Controls");
    if(currentChain.chainStatus !== "ENABLE") return res.status(400).send("Admin Has Disabled This Chain. Please Try After Some Time");

    // fee validations
    const totalFee_chain = currentChain.fee
    if(totalFee_chain > hash_dec.amount) return res.status(400).send("Fee Is Greater Than Amount");
    let finalAmount = hash_dec.amount;

    // Apply fee only if fee_type is exactly "USER"
    if (hash_dec?.fee_type === "USER") {
        finalAmount = hash_dec.amount + totalFee_chain;
    }
    // const address = '0x289A53817F0ed41e743112aDb0Db5437c953482F'
    // const address = cryptojs.generateRandomString(10)
    // const address ="0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8"
console.log(currentChain,"----->hash_dec");
    const chain = currentChain.chainName

    const addressObj = await address_generate(user,chain)
    console.log(addressObj,"------addressObj-->");
    if(!addressObj || !addressObj.address) return res.status(400).send("Error In Generating Deposit Address. Please Try Again Later")
    // const address ="0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8"

    // const secret_key = cryptojs.generateRandomString(10)
    // console.log(secret_key,"------s-->");
    
    const transactionData = {
        tId:await cryptojs.generateRandomString(15),
        invNo: hash_dec.invNo,
        amount: finalAmount,
        address:chain==="Tron"? addressObj.address.base58 : addressObj.address,
        secret_key:addressObj.privateKey,
        ..._.pick(user, ['userId', 'userName', 'email']),
        ..._.pick(currentCoin, ['coinId', 'coinName', 'coinTicker']),
        ..._.pick(currentChain, ['chainId', 'chainName']),
        fee: totalFee_chain,
        fee_type :hash_dec.fee_type,
        comment: `Deposit to ${addressObj.address} with fee "${totalFee_chain}"`,
        status:"PENDING",
        type:"DEPOSIT",
        others : chain === "Tron"? { encryptedAddressObj :await cryptojs.encrypt(addressObj) } : {}

    }
    const transaction = await mongoFunctions.create("Transaction", transactionData)

    const responseData = {
        tId: transaction.tId,
        ...hash_dec,
        amount: transaction.amount,
        fee: totalFee_chain,
        coin: _.pick(currentCoin, ['coinId', 'coinName', 'coinLogo', 'coinTicker']),
        chain: _.pick(currentChain, ['chainId', 'chainName', 'chainLogo','contractAddress','chainKey']),
        address:chain==="Tron"? addressObj.address.base58 : addressObj.address,

    }
    return res.status(200).send(responseData)
}))

const stats =require('../../helpers/stats');
const authAdmin = require('../../middlewares/authAdmin')
// test stats
user.post('/testStats', asyncFun (async (req, res) => {
    const s = await stats.saveStats("deposits","200","USDT" );
    return res.status(200).send(s)
}))
// deposits", "withdraw

user.post('/get_transaction',auth, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    console.log("req",req.body);
    // req.body = {enc : cryptojs.encryptObj(req.body)}

        console.log(req.body);
        const payload =await cryptojs.decrypt(req.body.enc)
        console.log(payload);
        if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
        if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")
    
        const { error } = validations.validate_tid(payload)
        if(error) return res.status(400).send(error.details[0].message)

    const pending_withdrawals = await mongoFunctions.find("Transaction", {tId:payload.tid },{_id:0, __v:0,invNo:0})
    // console.log(pending_withdrawals);
    return res.status(200).send(await cryptojs.encrypt(pending_withdrawals))


}))
module.exports = user





