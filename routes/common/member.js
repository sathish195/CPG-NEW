const express = require('express')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const rateLimitter = require('../../helpers/rateLimitter')
const recaptcha = require('../../middlewares/recaptcha')
const validations = require('../../helpers/validations')
const cryptojs = require('../../helpers/cryptojs')
const mongoFunctions = require('../../helpers/mongoFunctions')
const asyncFun = require('../../middlewares/asyncFun')
const redis = require('../../helpers/redis')
const auth = require('../../middlewares/auth')
const authMember = require('../../middlewares/authMember')
const jwt = require('../../helpers/jwt')
const tigerBalm = require('../../helpers/tigerBalm')
const telegram = require('../../helpers/telegram')
const tfa = require('speakeasy')
const controllers = require('../../helpers/controllers')
const moment = require('moment')
const slowDownLimitter = require('../../helpers/slowDownLimitter')

const member = express.Router()

// no auth route
member.post('/noauth', asyncFun (async (req, res) => {
    telegram.alertDev(`✅ New noauth hit ✅`)
    // const updatedUsers = await mongoFunctions.updateMany("User", { }, { merchantFee: 2 })
    return res.status(200).send("done")
}))

// @METHOD: POST
// @ROUTE: /api/member/login
// @DESC: To login
member.post('/login', slowDownLimitter, rateLimitter, recaptcha, asyncFun (async (req, res) => {
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.validateLogin(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get member
    const filter = { email: payload.email }
    let member = await mongoFunctions.findOne("User", filter)
    if(!member) {
        member = await mongoFunctions.findOne("Admin", filter)
    }
    if(!member) return res.status(400).send("No Account Found. Please Try Again")
    if(member && member.status === "BLOCKED") return res.status(401).send("You Are Not Allowed To Process Current Request! Contact Admin")

    // check admin controls
    if(!member.isAdmin) {
        // get admin controls
        const adminControls = await redis.hGet("cpg_admin", "controls", "AdminControls", { })
        if(!adminControls) return res.status(401).send("Admin Controls Not Added")
        if(adminControls.login !== "ENABLE") return res.status(401).send("Admin Has Disabled Login. Please Try Again After Some Time")
    }

    // validate password
    const validPassword = await bcrypt.compare(payload.password, member.password)
    if(!validPassword) return res.status(400).send("Incorrect Password. Please Try Again")

    // save otp to redis
    if(member.tfaStatus !== "ENABLE") await redis.setEx(`cpg-login-otp-${member.email}`, '123456', '180')

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: member.tfaStatus === "ENABLE" ? "Proceed To Verify 2FA Code" : "OTP Sent To Email", email: member.email, tfaStatus: member.tfaStatus }))
}))

// @METHOD: POST
// @ROUTE: /api/member/verifyOtp_login
// @DESC: To verify otp for login
member.post('/verifyOtp_login', slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin controls
    const adminControls = await controllers.getAdminControls()

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.verifyOtp_login(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get member
    const filter = { email: payload.email }
    let member = await mongoFunctions.findOne("User", filter)
    if(!member) {
        member = await mongoFunctions.findOne("Admin", filter)
    }
    if(!member) return res.status(400).send("No Account Found. Please Try Again")
    if(member && member.status === "BLOCKED") return res.status(401).send("You Are Not Allowed To Process Current Request! Contact Admin")

    // verfiy 2fa
    if(member.tfaStatus === "ENABLE") {
        if(!payload.tfaCode) return res.status(400).send("2FA Code Is Required");

        // validate tfa key
        if(!member.tfaKey || member.tfaKey === "0") return res.status(400).send("No 2FA Key Found")

        // decrypt tfa key
        const tfaKey = tigerBalm.decrypt(member.tfaKey)

        // 2fa code validations
        const tfaResult = tfa.totp.verifyDelta({
            secret: tfaKey,
            encoding: 'base32',
            token: payload.tfaCode,
        });
        if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
        if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")
    }else {
        if(!payload.otp) return res.status(400).send("OTP Is Required")
        const otp = await redis.get(`cpg-login-otp-${member.email}`)
        if(!otp) return res.status(400).send("OTP Expired. Please Try Resend OTP")
        if(otp !== payload.otp) return res.status(400).send("Incorrect OTP. Please Try Again")

        // delete otp
        await redis.delete(`cpg-login-otp-${member.email}`)
    }

    // update member
    const collection = member.isAdmin ? "Admin" : "User"
    const update = { ip: payload.ip, browserId: payload.browserId }
    const updatedMember = await mongoFunctions.findOneAndUpdate(collection, { email: member.email, status: "ACTIVE" }, update, { new: true })

    // save member in redis
    const key = member.isAdmin ? "cpg_admins" : "cpg_users"
    await redis.hSet(key, member.email, JSON.stringify(updatedMember))

    // get token
    const jwtToken = jwt.sign(member)

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj(jwtToken))
}))

// @METHOD: POST
// @ROUTE: /api/member/verifyOtp
// @DESC: To verify otp
member.post('/verifyOtp', slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get controls
    const adminControls = await controllers.getAdminControls()

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.verifyOtp(payload)
    if(error) return res.status(400).send(error.details[0].message)
    console.log("payload verify otp -->", payload)

    // get member
    let member = await mongoFunctions.findOne("User", { email: payload.email })
    if(!member) {
        member = await mongoFunctions.findOne("Admin", { email: payload.email })
    }
    if(!member) return res.status(400).send("No Account Found With Given Email")
    if(member && member.status === "BLOCKED") return res.status(401).send("You Are Not Allowed To Process Current Request! Contact Admin")
    if(member && payload.key !== "register" && member.status !== "ACTIVE") return res.status(401).send("Someting Went Wrong! Contact Admin")

    // otp validations
    if(payload.key === "register" || payload.key === "tfa") {
        // check otp
        if(!payload.otp) return res.status(400).send("OTP Is Required")
        
        // get otp
        const otp = await redis.get(`cpg-${payload.key}-otp-${payload.email}`)
        if(!otp) return res.status(400).send("OTP Expired. Please Try Resend OTP")
        if(otp !== payload.otp) return res.status(400).send("Incorrect OTP. Please Try Again");

        // delete otp
        await redis.delete(`cpg-${payload.key}-otp-${payload.email}`)
    }else {
        if(member.tfaStatus === "ENABLE") {
            if(!payload.tfaCode) return res.status(400).send("2FA Code Is Required");
    
            // validate tfa key
            if(!member.tfaKey || member.tfaKey === "0") return res.status(400).send("No 2FA Key Found")
    
            // decrypt tfa key
            const tfaKey = tigerBalm.decrypt(member.tfaKey)
    
            // 2fa code validations
            const tfaResult = tfa.totp.verifyDelta({
                secret: tfaKey,
                encoding: 'base32',
                token: payload.tfaCode,
            });
            if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
            if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")
        }
    }

    // update member
    const collection = member.isAdmin ? "Admin" : "User"
    const update = { ip: payload.ip, browserId: payload.browserId }
    if(payload.key === "register") {
        update.status = "ACTIVE";
        if(!member.isAdmin) update.balances = controllers.getDefaultBalances(adminControls.coins);
    }
    const updatedMember = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, update, { new: true })

    // update member in redis
    const key = member.isAdmin ? "cpg_admins" : "cpg_users"
    await redis.hSet(key, member.email, JSON.stringify(updatedMember))

    // create token
    if(payload.key === "register" || payload.key === 'login') {
        const jwtToken = jwt.sign(member,

            { expiresIn: "1d" }
        )

        if(payload.key === 'register') {
            // alert dev
            telegram.alertDev(`✅ New ${member.isAdmin ? 'admin' : 'user'} registered ✅ %0A
            email --> ${updatedMember.email} %0A
            ${member.isAdmin ? 'admin type --> ' + updatedMember.adminType : ''}`)
        }

        // send encrypted response
        return res.status(200).send(cryptojs.encryptObj(jwtToken))
    }

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: "Code Verified Successfully" }))

}))

// @METHOD: POST
// @ROUTE: /api/member/resendOtp
// @DESC: To resend otp for member
member.post('/resendOtp', slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")
    console.log("payload -->", payload)

    // validate payload
    const { error } = validations.validateResendOtp(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get member
    let member = await mongoFunctions.findOne("User", { email: payload.email })
    if(!member) {
        member = await mongoFunctions.findOne("Admin", { email: payload.email })
    }
    if(!member) return res.status(400).send("No Account Found With Given Email")
    if(member && member.status === "BLOCKED") return res.status(401).send("You Are Not Allowed To Process Current Request! Contact Admin")
    if(member && payload.key !== "register" && member.status !== "ACTIVE") return res.status(401).send("Someting Went Wrong! Contact Admin")

    // check auth type for change password otp
    if(payload.key === "change"){
        const selfAuthExists = (member.auth.filter(ele => ele === "self"))[0]
        if(!selfAuthExists) return res.status(401).send("Can't Change Password. Please Try Again")
    }

    // send otp
    console.log("redis key -->", `cpg-${payload.key}-otp-${member.email}`)
    await redis.setEx(`cpg-${payload.key}-otp-${member.email}`, '123456', '180')

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: "OTP Sent To Email" }))
}))

// @METHOD: POST
// @ROUTE: /api/member/forgot
// @DESC: To process forgot otp
member.post('/forgot', slowDownLimitter, rateLimitter, recaptcha, asyncFun (async (req, res) => {
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.validateEmail(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get member
    let member = await mongoFunctions.findOne("User", { email: payload.email })
    if(!member) {
        member = await mongoFunctions.findOne("Admin", { email: payload.email })
    }
    if(!member) return res.status(400).send("No Account Found With Given Email")
    if(member) {
        if(member.status === "BLOCKED") return res.status(401).send("You Are Not Allowed To Process Current Request! Contact Admin")
        if(member.status !== "ACTIVE") return res.status(400).send("No Account Found With Given Email")
    }

    // send otp
    if(member.tfaStatus !== "ENABLE") await redis.setEx(`cpg-forgot-otp-${member.email}`, '123456', '180')

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: member.tfaStatus !== "ENABLE" ? "OTP Sent To Email" : "Proceed To Verify 2FA Code", tfaStatus: member.tfaStatus }))
}))

// @METHOD: POST
// @ROUTE: /api/member/reset
// @DESC: To reset otp
member.post('/reset', slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.resetPassword(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get member
    let member = await mongoFunctions.findOne("User", { email: payload.email })
    if(!member) {
        member = await mongoFunctions.findOne("Admin", { email: payload.email })
    }
    if(member) {
        if(member.status === "BLOCKED") return res.status(401).send("You Are Not Allowed To Process Current Request! Contact Admin")
        if(member.status !== "ACTIVE") return res.status(400).send("No Account Found With Given Email")
    }

    // verfiy 2fa
    if(member.tfaStatus === "ENABLE") {
        if(!payload.tfaCode) return res.status(400).send("2FA Code Is Required");

        // validate tfa key
        if(!member.tfaKey || member.tfaKey === "0") return res.status(400).send("No 2FA Key Found")

        // decrypt tfa key
        const tfaKey = tigerBalm.decrypt(member.tfaKey)

        // 2fa code validations
        const tfaResult = tfa.totp.verifyDelta({
            secret: tfaKey,
            encoding: 'base32',
            token: payload.tfaCode,
        });
        if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
        if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")
    }else {
        // verify otp
        if(!payload.otp) return res.status(400).send("OTP Is Required")
        const otp = await redis.get(`cpg-forgot-otp-${member.email}`)
        if(!otp) return res.status(400).send("OTP Expired. Please Try Resend OTP")
        if(otp !== payload.otp) return res.status(400).send("Incorrect OTP. Please Try Again")

        // delete otp in redis
        await redis.delete(`cpg-forgot-otp-${member.email}`)
    }
    
    // hash password
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(payload.password, salt)

    // update member
    const collection = member.isAdmin ? "Admin" : "User"
    const update = { password: hashed, ip: payload.ip, browserId: payload.browserId }
    // check if self auth type exists
    const selfAuthExists = (member.auth.filter(ele => ele === "self"))[0]
    if(!selfAuthExists) {
        update.$push = { auth: "self" }
    }
    const updatedMember = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, update, { new: true })

    // update member in redis
    const key = member.isAdmin ? "cpg_admins" : "cpg_users"
    await redis.hSet(key, member.email, JSON.stringify(updatedMember))

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: "Reset Password Successful" }))
}))

// @METHOD: POST
// @ROUTE: /api/member/tfa
// @DESC: To enable 2fa for member
member.post('/tfa', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    const { member } = req

    // verify tfa status
    if(member.tfaStatus === "ENABLE") return res.status(400).send("2FA Status Has Already Enabled")

    // create tfa key
    const options = {
        name: member.email,
    }
    // const { secret, qr } = tfa.generateSecret(options)
    const secret = tfa.generateSecret(options)

    // update member with tfaKey & tfaStatus
    const tfaKey = tigerBalm.encrypt(secret.base32)
    const collection = req.member.isAdmin ? "Admin" : "User"
    const updatedMember = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, { tfaKey, tfaStatus: "ACTIVE" }, { new: true })

    // update member in redis
    const key = req.member.isAdmin ? "cpg_admins" : "cpg_users"
    await redis.hSet(key, member.email, JSON.stringify(updatedMember))

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ url: secret.otpauth_url }))
}))

// @METHOD: POST
// @ROUTE: /api/member/verifyTfa
// @DESC: To verify 2fa code to enable 2fa status for member
member.post('/verifyTfa', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    const { member } = req

    // validate tfa status
    if(member.tfaStatus === "ENABLE") return res.status(400).send("2FA Status Has Already Enabled")
    if(member.tfaStatus === "DISABLE") return res.status(400).send("Unable To Process. Please Try Again (or) Try After Re-Login")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.verifyTfa(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // verify tfa code
    const tfaKey = tigerBalm.decrypt(member.tfaKey)
    const tfaResult = tfa.totp.verifyDelta({
        secret: tfaKey,
        encoding: 'base32',
        token: payload.tfaCode,
    });
    if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
    if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")

    // update member
    const collection = member.isAdmin ? "Admin" : "User"
    const updatedMember = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, { tfaStatus: "ENABLE", ip: payload.ip, browserId: payload.browserId }, { new: true })

    // update member in redis
    const key = member.isAdmin ? "cpg_admins" : "cpg_users"
    await redis.hSet(key, member.email, JSON.stringify(updatedMember))

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: "2FA Enabled Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/member/disableTfa
// @DESC: To disable 2fa code for member
member.post('/disableTfa', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    const { member } = req

    // validate tfa status
    if(member.tfaStatus === "DISABLE") return res.status(400).send("2FA Status Has Already Disabled. Please Try Again (or) Try After Re-Login")
    if(member.tfaStatus !== "ENABLE") return res.status(400).send("2FA Status Hasn't Enabled Yet. Please Try Again (or) Try After Re-Login")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.disableTfa(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // otp validations
    const otp = await redis.get(`cpg-tfa-otp-${member.email}`)
    if(!otp) return res.status(400).send("OTP Expired. Please Try Resend OTP")
    if(otp !== payload.otp) return res.status(400).send("Incorrect OTP. Please Try Again")

    // verify tfa code
    const tfaKey = tigerBalm.decrypt(member.tfaKey)
    const tfaResult = tfa.totp.verifyDelta({
        secret: tfaKey,
        encoding: 'base32',
        token: payload.tfaCode,
    });
    if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
    if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")

    // update tfa status of member
    const collection = member.isAdmin ? "Admin" : "User"
    const updatedMember = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, { tfaKey: "0", tfaStatus: "DISABLE", ip: payload.ip, browserId: payload.browserId }, { new: true })

    // update member in redis
    const key = member.isAdmin ? "cpg_admins" : "cpg_users"
    await redis.hSet(key, member.email, JSON.stringify(updatedMember))

    // delete otp from redis
    await redis.delete(`cpg-tfa-otp-${member.email}`)

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: "2FA Disabled Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/member/changePassword
// @DESC: To change password for member
member.post('/changePassword', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    let coll = req.member.isAdmin ? "Admin" : "User"
    const member = await mongoFunctions.findOne(coll, { email: req.member.email })
    if(!member) return res.status(400).send("No Account Found With Given Email")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.changePassword(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // check member auth
    const selfAuthExists = (member.auth.filter(ele => ele === "self"))[0]
    if(!selfAuthExists) return res.status(400).send("Invalid Request. Please Try Again")

    // validate password
    const passwordValid = await bcrypt.compare(payload.oldPassword, member.password)
    if(!passwordValid) return res.status(400).send("Invalid Old Password. Please Try Again")

    // verify tfa code
    if(member.tfaStatus === "ENABLE") {
        // get tfa code
        if(!payload.tfaCode) return res.status(400).send("2FA Code Is Required");
        if(!member.tfaKey || member.tfaKey === "0") return res.status(400).send("No 2FA Key Found")

        // decrypt tfa key
        const tfaKey = tigerBalm.decrypt(member.tfaKey)

        // 2fa code validations
        const tfaResult = tfa.totp.verifyDelta({
            secret: tfaKey,
            encoding: 'base32',
            token: payload.tfaCode,
        });
        if(!tfaResult || tfaResult.delta === null || tfaResult.delta === undefined) return res.status(400).send("Invalid 2FA Code! Please Try Again")
        if(tfaResult.delta < -1) return res.status(400).send("2FA Code Expired! Please Try Again")
    }else {
        if(!payload.otp) return res.status(400).send("OTP Is Required")

        // get otp
        const otp = await redis.get(`cpg-change-otp-${member.email}`)
        if(!otp) return res.status(400).send("OTP Expired. Please Try Resend OTP")
        if(otp !== payload.otp) return res.status(400).send("Incorrect OTP. Please Try Again")

        // delete otp
        await redis.delete(`cpg-change-otp-${member.email}`)
    }

    // hash password
    const salt = await bcrypt.genSalt(10)
    payload.password = await bcrypt.hash(payload.password, salt)

    // update member
    const collection = member.isAdmin ? "Admin" : "User"
    const updatedMember = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, { password: payload.password }, { new: true })

    // update member in redis
    const key = member.isAdmin ? "cpg_admins" : "cpg_users"
    await redis.hSet(key, member.email, JSON.stringify(updatedMember))

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj({ message: "Password Changed Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/member/getBalances
// @DESC: To get member balances
member.post('/getBalances', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    let coll = req.member.isAdmin ? "Admin" : "User"
    const member = await mongoFunctions.findOne(coll, { email: req.member.email })

    // get admin controls
    const adminControls = await controllers.getAdminControls()
    
    // get coin names from admin controls
    const coins = adminControls.coins

    // create balances
    let balances = []
    if(member.isAdmin){
        if(coins && coins.length) {
            // get total balances
            const pipeline = [
                {
                    $unwind: '$balances', // Unwind the balances array
                },
                {
                    $group: {
                        _id: {
                            coinId: '$balances.coinId',
                            coinName: '$balances.coinName',
                            coinTicker: '$balances.coinTicker',
                        },
                        balance: { $sum: '$balances.balance' },
                        precision: { $first: '$balances.precision' },
                        coinLogo: { $first: '$balances.coinLogo' },
                        coinStatus: { $first: '$balances.coinStatus' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        coinId: '$_id.coinId',
                        coinName: '$_id.coinName',
                        coinTicker: '$_id.coinTicker',
                        balance: 1,
                        precision: 1,
                        coinLogo: 1,
                        coinStatus: 1,
                    },
                },
            ]
            balances = await mongoFunctions.aggregate("User", pipeline)
            balances = balances && balances.length ? balances.map(res => {
                return {
                    ...res,
                    balance: controllers.getPrecession(res.balance, res.precision)
                }
            }) : []
        }
    }else {
        const defaultBalances = coins?.length ? coins.map(coin => { return { coinId: coin.coinId, coinName: coin.coinName, coinTicker: coin.coinTicker, coinLogo: coin.coinLogo, coinStatus: coin.coinStatus, balance: controllers.getPrecisionByCoin(0, coin.coinName), settlement: { settlementType: '', settlementIn: 0, address: '' } } }) : []
        balances = member.balances && member.balances.length ? member.balances.map(bal => {
            return {
                coinId: bal.coinId,
                coinName: bal.coinName,
                coinTicker: bal.coinTicker,
                coinLogo: bal.coinLogo,
                coinStatus: bal.coinStatus,
                settlement: bal.settlement,
                precision: bal.precision,
                balance: controllers.getPrecession(bal.balance, bal.precision)
            }
        }) : defaultBalances
    }
    console.log("balances -->",balances)
    return res.status(200).send(cryptojs.encryptObj(balances))
}))

// @METHOD: POST
// @ROUTE: /api/member/getStats
// @DESC: To get stats for dashboard
member.post('/getStats', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get stats
    const totalInvMatch = { $match: { type: "CREDIT" } }
    const tdyInvMatch = { $match: { type: "CREDIT", createdAt: { $gte: controllers.getTodayStart(), $lt: controllers.getTmrwStart() } } }
    const sucInvMatch = { $match: { type: "CREDIT", status: "SUCCESS" } }
    const failInvMatch = { $match: { type: "CREDIT", status: "FAILED" } }
    if(!req.member.isAdmin) {
        totalInvMatch.$match.userId = req.member.userId
        tdyInvMatch.$match.userId = req.member.userId
        sucInvMatch.$match.userId = req.member.userId
        failInvMatch.$match.userId = req.member.userId
    }
    const pipeline = [
        {
            $facet: {
                totalInvoices: [totalInvMatch, { $count: "count" }],
                todayInvoices: [tdyInvMatch, { $count: "count" }],
                successInvoices: [sucInvMatch, { $count: "count" }],
                failedInvoices: [failInvMatch, { $count: "count" }],
            }
        }
    ]
    const result = await mongoFunctions.aggregate("Transaction", pipeline)
    const {
        totalInvoices,
        todayInvoices,
        successInvoices,
        failedInvoices
    } = result[0]

    const stats = {
        totalInvoices: totalInvoices[0]?.count || 0,
        todayInvoices: todayInvoices[0]?.count || 0,
        successInvoices: successInvoices[0]?.count || 0,
        failedInvoices: failedInvoices[0]?.count || 0
    }

    return res.status(200).send(cryptojs.encryptObj(stats))
}))

// @METHOD: POST
// @ROUTE: /api/member/getTickets
// @DESC: To get all tickets for admin/user
member.post('/getTickets', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    const { member } = req

    // get status
    const { status } = req.query

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.getList(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get tickets
    const filter = member.isAdmin ? { } : { userId: member.userId }
    if(status) {
        filter.status = status.toUpperCase()
    }
    const options = {
        sort: { createdAt: -1 },
        skip: payload.skip,
        limit: payload.limit,
        select: member.isAdmin ? 'ticketId userId userName email status closedBy createdAt' : 'ticketId status closedBy createdAt'
    }
    const tickets = await mongoFunctions.find("Ticket", filter, options)

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj(tickets))
}))

// @METHOD: POST
// @ROUTE: /api/member/getTickets/:search
// @DESC: To get ticket by ticket id/userid/username for admin/user
member.post('/getTickets/:search', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    const { member } = req

    // get ticket id
    const { search } = req.params
    if(!search || search === "null" || search === "undefined") return res.status(400).send("Invalid Search. Please Try Again")

    // validate search
    const { error:searchError } = validations.validateIdOrUsername({ search })
    if(searchError) return res.status(400).send(searchError.details[0].message)

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.getList(payload, member.isAdmin)
    if(error) return res.status(400).send(error.details[0].message)

    // get ticket
    const filter = member.isAdmin ? { $or:[{ ticketId: search }, { userId: search }, { userName: search }] } : { userId: member.userId, ticketId: search }
    const options = {
        sort: { createdAt: -1 },
        select: member.isAdmin ? 'ticketId userId userName email status messages closedBy createdAt' : 'ticketId status messages closedBy createdAt'
    }
    if(member.isAdmin) {
        skip = payload.skip
        limit = payload.limit
    }
    const tickets = await mongoFunctions.find("Ticket", filter, options)
    if(!tickets || !tickets.length) return res.status(400).send("No Ticket Found. Please Try Again")

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj(tickets))
}))

// @METHOD: POST
// @ROUTE: /api/member/getTransactions
// @DESC: To get all transactions for admin/user
member.post('/getTransactions', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get member
    const { member } = req

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.getTransactions(payload)
    if(error) return res.status(400).send(error.details[0].message);
    
    // validtions
    const filters = payload.filters
    let { fromDate, toDate, search, type } = filters
    if(fromDate && !toDate) return res.status(400).send("To Date Is Required")
    if(toDate && !fromDate) return res.status(400).send("From Date Is Required")

    // get transactons
    const filter = {};
    filter['type'] = type === 'withdraw' ? "DEBIT" : "CREDIT";
    if (fromDate && toDate) {
        fromDate = moment(fromDate, "YYYY-MM-DD").toDate()
        toDate = moment(toDate, "YYYY-MM-DD").toDate()
        toDate = moment(toDate).add(1, 'days').toDate()
        filter['createdAt'] = { $gte: fromDate, $lt: toDate }
    }
    if(!member.isAdmin) {
        filter['userId'] = member.userId
        if(search) filter['tId'] = search
    }else {
        if(search) filter['$or'] = [{ userId: search }, { tId: search }]
    }
    const options = {
        sort: { createdAt: -1 },
        skip: payload.skip,
        limit: payload.limit,
        select: member.isAdmin ? 'tId invNo userId userName email type status coinName coinTicker chainName amount status fee address comment createdAt' : 'tId invNo type status coinName coinTicker chainName amount status fee address comment createdAt'
    }
    const transactions = await mongoFunctions.find("Transaction", filter, options)
    console.log("payload, filter, trasactions length -->", payload, filter, transactions.length)

    return res.status(200).send(cryptojs.encryptObj(transactions))
}))

// @METHOD: POST
// @ROUTE: /api/member/getControls
// @DESC: To get member controls
member.post("/getControls", slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin controls
    const adminControls = await controllers.getAdminControls()

    // send encrypted response
    return res.status(200).send(cryptojs.encryptObj(adminControls))
}))

// @METHOD: POST
// @ROUTE: /api/member/getChains
// @DESC: To get chains based on coin
member.post('/getChains', auth, authMember, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload = cryptojs.decryptObj(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.validateId(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // get coin
    let filter = { "coins.coinId": payload.id }
    let options = {
        projection: { 'coins.$': 1 }
    }
    const coin = await mongoFunctions.findOne("AdminControls", filter, options)
    const currentCoin = coin.coins[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin Id");
    const chains = currentCoin?.chains || []

    return res.status(200).send(cryptojs.encryptObj(chains))
}))

module.exports = member