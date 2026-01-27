const express = require('express')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const asyncFun = require('../../middlewares/asyncFun')
const rateLimitter = require('../../helpers/rateLimitter')
const cryptojs = require('../../helpers/cryptojs')
const validations = require('../../helpers/validations')
const mongoFunctions = require('../../helpers/mongoFunctions')
const redis = require('../../helpers/redis')
const auth = require('../../middlewares/auth')
const authAdmin = require('../../middlewares/authAdmin')
const telegram = require('../../helpers/telegram')
const controllers = require('../../helpers/controllers')
const tfa = require('speakeasy')
const tigerBalm = require('../../helpers/tigerBalm')
const slowDownLimitter = require('../../helpers/slowDownLimitter')
const producer = require('../../helpers/producer')


const admin = express.Router()

// @METHOD: POST
// @ROUTE: /api/admin/register
// @DESC: To register new admin
admin.post('/register', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // super admin validations
    if(req.admin.adminType !== "1") return res.status(401).send("You Don't Have Access To Register Admin")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.registerAdmin(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // validate username and email
    const adminExists = await mongoFunctions.findOne("Admin", { email: payload.email })
    if(adminExists) return res.status(400).send("Email Already Exists")

    // check if userName or email exists in user
    const userExists = await mongoFunctions.findOne("User", { email: payload.email })
    if(userExists) return res.status(400).send("Email Already Exists")

    // hash password
    const salt = await bcrypt.genSalt(10)
    payload.password = await bcrypt.hash(payload.password, salt)

    // create admin
    
    let adminData = {
        adminId: 'CPG'+await cryptojs.generateRandomString(),
        ...payload,
        status: "ACTIVE",
        balances : controllers.getDefaultBalances(adminControls.coins)
    }
    console.log(adminData,"adminData------->");
    const admin = await mongoFunctions.create("Admin", adminData)

    // send otp
    await redis.setEx(`cpg-register-otp-${admin.email}`, '123456', '180')

    // return res.status(200).send(await cryptojs.encrypt({ message: "OTP Send To Email" }))
    return res.status(200).send(await cryptojs.encrypt({ message: "Admin Added Successfully" }))

}))

// @METHOD: POST
// @ROUTE: /api/admin/getAdmins
// @DESC: To get all admins list for admin
admin.post('/getAdmins', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.getList(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get admins
    const options = {
        sort: { createdAt: -1 },
        skip: payload.skip,
        limit: payload.limit,
        select: 'dateOfRegister adminId userName email status adminType createdAt'
    }
    const admins = await mongoFunctions.find("Admin", { }, options)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt(admins))
}))


admin.post('/getProfile', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get user
    const { admin } = req;
    // console.log(admin,"admin in getProfile");

    
    // create response object
    // const response = _.pick(user, ['userId', 'userName', 'email', 'withdrawStatus', 'transactionStatus','tfaStatus'])
    // console.log(admin,"user in getProfile");

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt(admin))
}))


// @METHOD: POST
// @ROUTE: /api/admin/getUsers
// @DESC: To get all users list for admin
admin.post('/getUsers', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.getUsers(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get uers
    const filter = {}
    const filters = payload.filters
    const { search } = filters
    console.log(search,"search------->");
    // filter['$or'] = [{ userId: search.toUpperCase() }, { email: search.toLowerCase() }]
    if(search) {
        filter['$or'] = [
            { userId: { $regex: `^${search}`, $options: 'i' } },
            { email: { $regex: `^${search}`, $options: 'i' } }
          ]
    }
    console.log(payload,"payload------->");
    console.log(filter,"search------->");
    const options = {
        sort: { createdAt: -1 },
        skip: payload.skip,
        limit: payload.limit,
        select: 'dateOfRegister userId userName email status createdAt'
    }
    console.log(options,"options------->");
    const users = await mongoFunctions.find("User", filter, options)
    console.log(users,"users------->");

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt(users))
}))

// @METHOD: POST
// @ROUTE: /api/admin/getUsers/:search
// @DESC: To get users by user id or username or email
admin.post('/getUsers/:search', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get search
    const { search } = req.params
    if(!search || search === "null" || search === "undefined") return res.status(400).send("Invalid Search. Please Try Again")

    // validate search
    const { error } = validations.validateIdOrEmail({ search })
    if(error) return res.status(400).send(error.details[0].message)

    // get user
    const filter = {
        $or: [{ email: search }, { userId: search }]
    }
    const options = {
        select: 'dateOfRegister userId userName email status tfaStatus balances keys referralStatus transactionStatus withdrawStatus merchantFee createdAt'
    }
    const user = await mongoFunctions.findOne("User", filter, options)
    if(!user) return res.status(400).send("No User Found. Please Try Again");
    let keys = user.keys
    if(keys && keys.length) {
        keys = keys.map(key => {
            return {
                appName: key.appName,
                appKey: tigerBalm.decrypt(key.appKey),
                successUrl: key.successUrl,
                notifyUrl: key.notifyUrl,
            }
        })
        user.keys = keys
    }else {
        keys = []
    }

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt(user))
}))

// @METHOD: POST
// @ROUTE: /api/admin/updateUser/:userId
// @DESC: To update user
admin.post('/updateUser/:userId', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get userId
    const { userId } = req.params
    if(!userId || userId === "null" || userId === "undefined") return res.status(400).send("Invalid User Id. Please Try Again");

    // user id validtions
    const { error: userIdError } = validations.validateId({ id: userId })
    if(userIdError) return res.status(400).send(userIdError.details[0].message);

    // get user
    const user = await mongoFunctions.findOne("User", { userId })
    if(!user) return res.status(400).send("No User Found. Please Try Again")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.updateUser(payload)
    if(error) return res.status(400).send(error.details[0].message)

        console.log(payload,"payload--------->");

	// update user
	const update = { }
	if(payload.status && payload.status !== user.status) update.status = payload.status
	if(payload.tfaStatus && payload.tfaStatus !== user.tfaStatus) {
        if((payload.tfaStatus).toLowerCase() === "disable") {
            update.tfaStatus = payload.tfaStatus
            update.tfaKey = '0'
        }
    }
    
	if(payload.referralStatus && payload.referralStatus !== user.referralStatus) update.referralStatus = payload.referralStatus
	if(payload.withdrawStatus && payload.withdrawStatus !== user.withdrawStatus) update.withdrawStatus = payload.withdrawStatus
	if(payload.transferStatus && payload.transferStatus !== user.transferStatus) update.transferStatus = payload.transferStatus
	if(payload.depositeStatus && payload.depositeStatus !== user.depositeStatus) update.depositeStatus = payload.depositeStatus

	if(payload.merchantFee) update.merchantFee = payload.merchantFee

    console.log(update,"update------->");
	if(update && (Object.keys(update)).length) {
		const updatedUser = await mongoFunctions.findOneAndUpdate("User", { userId }, update, { new: true })
		await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser))
	}

	// send encrypted response
	return res.status(200).send(await cryptojs.encrypt({ message: "User Updated Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/deleteUser
// @DESC: To delete user
admin.post('/deleteUser', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get current admin
    const { admin: currentAdmin } = req
    if(currentAdmin.adminType !== "1") return res.status(401).send("You Don't Have Access To Delete Admin");

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.validateEmail(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get user
    const user = await mongoFunctions.findOne("User", { email: payload.email })
    if(!user) return res.status(400).send("No User Found. Please Try Again")

    // delete user
    const response = await mongoFunctions.deleteOne("User", { email: payload.email })
    
    // delete user from redis
    await redis.hDel("cpg_users", payload.email)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "User Deleted Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/updateAdmin/:adminId
// @DESC: To update admin
admin.post('/updateAdmin/:adminId', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get current admin
    const { admin: currentAdmin } = req;
    if(currentAdmin.adminType !== "1") return res.status(401).send("You Don't Have Access To Update Admin")

    // get adminId
    const { adminId } = req.params
    if(!adminId || adminId === "null" || adminId === "undefined") return res.status(400).send("Invalid Admin Id. Please Try Again");

    // admin id validtions
    const { error: adminIdError } = validations.validateId({ id: adminId })
    if(adminIdError) return res.status(400).send(adminIdError.details[0].message);

    // get admin
    const admin = await mongoFunctions.findOne("Admin", { adminId })
    if(!admin) return res.status(400).send("No Admin Found. Please Try Again")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.updateAdmin(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // update admin
    const update = { }
    if(payload.status && payload.status !== admin.status) update['status'] = payload.status
    if(payload.adminType && payload.adminType !== admin.adminType) update['adminType'] = payload.adminType
    if(Object.keys(update).length) {
        // update admin
        const filter = { adminId }
        const updatedAdmin = await mongoFunctions.findOneAndUpdate("Admin", filter, update, { new: true })
        await redis.hSet("cpg_admins", updatedAdmin.email, JSON.stringify(updatedAdmin))

        // update current admin
        const updatedCurrentAdmin = await mongoFunctions.findOneAndUpdate("Admin", { adminId: currentAdmin.adminId }, { ip: payload.ip, browserId: payload.browserId }, { new: true })
        await redis.hSet("cpg_admin", updatedCurrentAdmin.email, JSON.stringify(updatedCurrentAdmin))
    }

    return res.status(200).send(await cryptojs.encrypt({ message: "Admin Updated Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/deleteAdmin
// @DESC: To delete admin
admin.post('/deleteAdmin', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get current admin
    const { admin: currentAdmin } = req
    if(currentAdmin.adminType !== "1") return res.status(401).send("You Don't Have Access To Delete Admin");

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.validateEmail(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get admin
    const admin = await mongoFunctions.findOne("Admin", { email: payload.email })
    if(!admin) return res.status(400).send("No Admin Found. Please Try Again");

    // delete admin
    const response = await mongoFunctions.deleteOne("Admin", { email: payload.email })
    
    // delete admin from redis
    await redis.hDel("cpg_admins", payload.email)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "Admin Deleted Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/updateControls
// @DESC: To update admin controls for admin
admin.post('/updateControls', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req

    // admin validations
    if(admin.adminType !== "1") return res.status(401).send("You Are Not Allowed To Update Admin Controls")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.updateAdminControls(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get admin controls
    let adminControls = await controllers.getAdminControls()
    const update = _.pick(payload, ['login', 'register', 'withdraw'])
    adminControls = await mongoFunctions.findOneAndUpdate("AdminControls", { _id: adminControls._id }, update, { new: true })

    // update admin
    const updatedAdmin = await mongoFunctions.findOneAndUpdate("Admin", { email: admin.email }, { ip: payload.ip, browserId: payload.browserId }, { new: true })

    // update admin in redis
    await redis.hSet("cpg_admins", admin.email, JSON.stringify(updatedAdmin))

    // save in redis
    await redis.hSet("cpg_admin", "controls", JSON.stringify(adminControls))

    // alert dev
    telegram.alertDev(`🕹️🔧 Admin controls updated 🔧🕹️ %0A
    login --> ${adminControls.login} %0A
    register --> ${adminControls.register} %0A
    withdraw --> ${adminControls.withdraw} %0A
    deposit --> ${adminControls.withdraw} %0A

    by --> ${admin.email}`)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt(adminControls))
}))

// @METHOD: POST
// @ROUTE: /api/admin/getCoin
// @DESC: To get coin from admin controls
admin.post('/getCoin', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req

    // admin validations
    if(admin.adminType !== "1") return res.status(401).send("You Are Not Allowed To Update Admin Controls")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.validateId(payload)
    if(error) return res.status(400).send(error.details[0].message)
    
    // get admin controls
    let adminControls = await controllers.getAdminControls()

    // get coin
    const allCoins = adminControls.coins
    const currentCoin = (allCoins.filter(coin => coin.coinId === payload.id))[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin ID. Please Try Again")

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ ..._.pick(currentCoin, ['_id', 'coinId', 'coinName', 'coinLogo', 'coinTicker', 'coinStatus', 'note', 'precision', 'withdraw', 'deposit', 'settlementMin']) }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/addCoin
// @DESC: To add new coin to admin controls and user
admin.post('/addCoin', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req
    console.log(req.admin,"req------->");
    console.log(admin,"admin------->");



    // admin validations
    if(admin.adminType !== "1") return res.status(401).send("You Are Not Allowed To Update Admin Controls")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    console.log(payload,"payload------->");
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.addCoin(payload)
    if(error) return res.status(400).send(error.details[0].message);
    console.log(1,"payload------->");

    // get admin controls
    let adminControls = await controllers.getAdminControls()

    // get coin
    const allCoins = adminControls.coins
    let coinExists = (allCoins.filter(coin => coin.coinName === payload.coinName))[0]
    if(coinExists) return res.status(400).send("Coin Name Already Exists")
    coinExists = (allCoins.filter(coin => coin.coinTicker === payload.coinTicker))[0]
    if(coinExists) return res.status(400).send("Coin Ticker Already Exists")
        console.log(2,"payload------->");
    
    // update admin controls
    const newCoin = {
        coinId:await cryptojs.generateRandomString(),
        ..._.pick(payload, ['coinName', 'coinTicker', 'coinStatus', 'note', 'precision', 'withdraw', 'deposit', 'settlementMin', 'coinLogo']),
    }
    adminControls = await mongoFunctions.findOneAndUpdate("AdminControls", { }, { $push: { coins: newCoin } }, { new: true })
    console.log(adminControls,"adminControls------->");
    await redis.hSet("cpg_admin", "controls", JSON.stringify(adminControls)) // update in redis
    console.log(3,"payload------->");
    
    // update users
    const newBalance = {
        ..._.pick(newCoin, ['coinId', 'coinName', 'coinTicker', 'coinStatus', 'coinLogo']),
        balance: controllers.getPrecession(0, payload.precision)
    }
    await mongoFunctions.updateMany("User", { }, { $push: { balances: newBalance } })
    await redis.delete("cpg_users") // remove users from redis
    console.log(3,"payload------->");

    // update admin
    const updatedAdmin = await mongoFunctions.findOneAndUpdate("Admin", { email: admin.email }, { ip: payload.ip, browserId: payload.browserId }, { new: true })
    console.log(updatedAdmin,"payload------->");
    console.log(admin,"payload------->");

    await redis.hSet("cpg_admins", admin.email, JSON.stringify(updatedAdmin)) // update in redis
    console.log(4,"payload------->");

    // alert dev
    telegram.alertDev(`🕹️🔧 Admin controls updated 🔧🕹️ %0A
	🪙 New coin added 🪙 %0A
	name --> ${newCoin.coinName} %0A
	ticker --> ${newCoin.coinTicker} %0A
	status --> ${newCoin.coinStatus} %0A
	withdraw min --> ${newCoin.withdraw?.withdrawMin} %0A
	withdraw max --> ${newCoin.withdraw?.withdrawMax} %0A
	withdraw fee --> ${newCoin.withdraw?.withdrawFee} %0A
	withdraw status --> ${newCoin.withdraw?.withdrawStatus} %0A
	deposit min --> ${newCoin.deposit?.depositMin} %0A
	deposit max --> ${newCoin.deposit?.depositMax} %0A
	deposit fee --> ${newCoin.deposit?.depositFee} %0A
	deposit status --> ${newCoin.deposit?.depositStatus} %0A
	by --> ${admin.email}`)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "Coin Added Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/updateCoin
// @DESC: To update coin in admin controls and user
admin.post('/updateCoin', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req

    // admin validations
    if(admin.adminType !== "1") return res.status(401).send("You Are Not Allowed To Update Admin Controls")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.updateCoin(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get admin controls
    const adminControls = await controllers.getAdminControls()

    // get coin
    const allCoins = adminControls.coins
    const currentCoin = (allCoins.filter(coin => coin.coinId === payload.coinId))[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin ID. Please Try Again")

    // update coin
    const update = {
        $set: {}
    }
    if(currentCoin.coinName !== payload.coinName) {
        const nameExists = allCoins.filter(coin => (coin.coinName).toLowerCase() === (payload.coinName).toLowerCase)[0]
        if(nameExists) return res.status(400).send("Coin Name Already Exists")
        update.$set['coins.$.coinName'] = payload.coinName
    }
    if(currentCoin.coinTicker !== payload.coinTicker) {
        // check coin ticker
        const tickerExists = allCoins.filter(coin => (coin.coinTicker).toLowerCase() === (payload.coinTicker).toLowerCase)[0]
        if(tickerExists) return res.status(400).send("Coin Ticker Already Exists")
        update.$set['coins.$.coinTicker'] = payload.coinTicker
    }
    if(currentCoin.coinStatus !== payload.coinStatus) update.$set['coins.$.coinStatus'] = payload.coinStatus
    if(currentCoin.note !== payload.note) update.$set['coins.$.note'] = payload.note
    if(currentCoin.precision !== payload.precision) update.$set['coins.$.precision'] = payload.precision
    if(JSON.stringify(currentCoin.withdraw) !== JSON.stringify(payload.withdraw)) update.$set['coins.$.withdraw'] = payload.withdraw
    if(JSON.stringify(currentCoin.deposit) !== JSON.stringify(payload.deposit)) update.$set['coins.$.deposit'] = payload.deposit
    if(currentCoin.settlementMin !== payload.settlementMin) update.$set['coins.$.settlementMin'] = payload.settlementMin
    if(currentCoin.coinLogo !== payload.coinLogo) update.$set['coins.$.coinLogo'] = payload.coinLogo
    if(Object.keys(update.$set).length) {
        // proceed to update
        update.ip = payload.ip
        update.browserId = payload.browserId
        let filter = { 'coins.coinId': payload.coinId } // filter
        const adminControls_updated = await mongoFunctions.findOneAndUpdate("AdminControls", filter, update, { new: true })
        await redis.hSet("cpg_admin", "controls", JSON.stringify(adminControls_updated)) // update in redis
    
        // update users
        const userUpdate = {
            $set: {}
        }
        if(currentCoin.coinName !== payload.coinName) userUpdate.$set['balances.$.coinName'] = payload.coinName
        if(currentCoin.coinTicker !== payload.coinTicker) userUpdate.$set['balances.$.coinTicker'] = payload.coinTicker
        if(currentCoin.coinStatus !== payload.coinStatus) userUpdate.$set['balances.$.coinStatus'] = payload.coinStatus
        if(currentCoin.precision !== payload.precision) userUpdate.$set['balances.$.precision'] = payload.precision
        if(currentCoin.coinLogo !== payload.coinLogo) userUpdate.$set['balances.$.coinLogo'] = payload.coinLogo
        if(Object.keys(userUpdate.$set).length) {
            let filter = { 'balances.coinId': payload.coinId } // filter
            await mongoFunctions.updateMany("User", filter, userUpdate, { multi: true })
            await redis.delete("cpg_users") // remove users from redis
        }

        // alert dev
        telegram.alertDev(`🕹️🔧 Admin controls updated 🔧🕹️ %0A
        🪙🔧 Coin updated 🔧🪙 %0A
        name --> ${payload.coinName} %0A
        ticker --> ${payload.coinTicker} %0A
        status --> ${payload.coinStatus} %0A
        withdraw min --> ${payload.withdraw?.withdrawMin} %0A
        withdraw max --> ${payload.withdraw?.withdrawMax} %0A
        withdraw fee --> ${payload.withdraw?.withdrawFee} %0A
        withdraw status --> ${payload.withdraw?.withdrawStatus} %0A
        deposit min --> ${payload.deposit?.depositMin} %0A
        deposit max --> ${payload.deposit?.depositMax} %0A
        deposit fee --> ${payload.deposit?.depositFee} %0A
        deposit status --> ${payload.deposit?.depositStatus} %0A
        settlement min --> ${payload.settlementMin} %0A
        by --> ${admin.email}`)
    }

    // update admin
    const updatedAdmin = await mongoFunctions.findOneAndUpdate("Admin", { email: admin.email }, { ip: payload.ip, browserId: payload.browserId }, { new: true })
    await redis.hSet("cpg_admins", admin.email, JSON.stringify(updatedAdmin)) // update in redis

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "Coin Updated Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/addChain
// @DESC: To add new chain in controls
admin.post('/addChain', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    // console.log(req,"req------->");
    
    
    const { admin } = req
    console.log(req.admin,"req------->");
    console.log(admin,"admin------->");

    // admin validations
    if(admin?.adminType !== "1") return res.status(401).send("You Are Not Allowed To Add New Chain");

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.addUpdateChain(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // get all coins
    const adminControls = await controllers.getAdminControls()
    const allCoins = adminControls.coins

    // get coin
    const currentCoin = allCoins?.filter(coin => coin.coinId === payload.coin)[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin Id");

    // check chain
    let chain = currentCoin?.chains.filter(chain => chain.chainId === payload.chainId)[0]
    if(chain) return res.status(400).send("Chain Id Already Exists");
    chain = currentCoin?.chains.filter(chain => chain.chainName === payload.chainName)[0]
    if(chain) return res.status(400).send("Chain Name Already Exists");

    // add chain
    const newChain = _.pick(payload, ['chainId', 'chainName', 'note', 'fee', 'min', 'max', 'chainLogo','contractAddress'])
    console.log(newChain,"newChain------->");
    let filter = { 'coins.coinId': payload.coin }
    let update = {
        $push: {
            'coins.$.chains': newChain
        }
    }
    const updatedAdminControls = await mongoFunctions.findOneAndUpdate("AdminControls", filter, update, { new: true })
    await redis.hSet("cpg_admin", "controls", JSON.stringify(updatedAdminControls))

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "Chain Added Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/updateChain
// @DESC: To update chain in conrols
admin.post('/updateChain', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req

    // admin validations
    if(admin?.adminType !== "1") return res.status(401).send("You Are Not Allowed To Add New Chain");
// req.body = {enc:cryptojs.encryptObj(req.body)}
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.addUpdateChain(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // get all coins
    const adminControls = await controllers.getAdminControls()
    const allCoins = adminControls.coins;
    // get coin
    const currentCoin = allCoins?.filter(coin => coin.coinId === payload.coin)[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin Id");

    // get chain
    const currentChain = currentCoin?.chains.filter(chain => chain.chainId === payload.chainId)[0]
    if(!currentChain) return res.status(400).send("No Chain Found With Given Chain Id");
    console.log(currentChain,"currentChain------->");

    // update chain
    const update = {
        $set: {}
    }
    if(currentChain.chainName !== payload.chainName) {
        const chainNameExists = currentCoin?.chains.filter(chain => chain.chainName.toLowerCase() === payload.chainName.toLowerCase())[0]
        if(chainNameExists) return res.status(400).send("Chain Name Already Exists");
        update.$set['coins.$[coin].chains.$[chain].chainName'] = currentChain.chainName
    }
    if(currentChain.note !== payload.note) update.$set['coins.$[coin].chains.$[chain].note'] = payload.note
    if(currentChain.fee !== payload.fee) update.$set['coins.$[coin].chains.$[chain].fee'] = payload.fee
    if(currentChain.min !== payload.min) update.$set['coins.$[coin].chains.$[chain].min'] = payload.min
    if(currentChain.max !== payload.max) update.$set['coins.$[coin].chains.$[chain].max'] = payload.max
    if(currentChain.chainStatus !== payload.chainStatus) update.$set['coins.$[coin].chains.$[chain].chainStatus'] = payload.chainStatus
    if(currentChain.chainLogo !== payload.chainLogo) update.$set['coins.$[coin].chains.$[chain].chainLogo'] = payload.chainLogo
    // if(!currentChain.contractAddress || currentChain.contractAddress !== payload.contractAddress) update.$set['coins.$[coin].chains.$[chain].contractAddress'] = payload.contractAddress
    if(!currentChain.contractAddress || currentChain.contractAddress !== payload.contractAddress) update.$set['coins.$[coin].chains.$[chain].contractAddress'] = payload.contractAddress


 console.log(update,"update------->");
    
    if(Object.keys(update.$set).length) {
        // update chain
        let filter = { 'coins.coinId': payload.coin, 'coins.chains.chainId': payload.chainId }
        let options = {
            arrayFilters: [{ 'coin.coinId': payload.coin }, { 'chain.chainId': payload.chainId }],
            new: true
        }
        const updatedAdminControls = await mongoFunctions.findOneAndUpdate("AdminControls", filter, update, options)
        await redis.hSet("cpg_admin", "controls", JSON.stringify(updatedAdminControls))
    }

    return res.status(200).send(await cryptojs.encrypt({ message: "Chain Updated Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/deleteChain
// @DESC: To delete chain
admin.post('/deleteChain', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req

    // admin validations
    if(admin?.adminType !== "1") return res.status(401).send("You Are Not Allowed To Add New Chain");

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.deleteChain(payload)
    if(error) return res.status(400).send(error.details[0].message);

    // get all coins
    const adminControls = await controllers.getAdminControls()
    const allCoins = adminControls.coins

    // get coin
    const currentCoin = allCoins?.filter(coin => coin.coinId === payload.coin)[0]
    if(!currentCoin) return res.status(400).send("No Coin Found With Given Coin Id");

    // get chain
    const currentChain = currentCoin?.chains.filter(chain => chain.chainId === payload.chain)[0]
    if(!currentChain) return res.status(400).send("No Chain Found With Given Chain Id");

    // delete chain
    let filter = { "coins.coinId": payload.coin, "coins.chains.chainId": payload.chain }
    let update = {
        $pull: { 'coins.$.chains': { chainId: payload.chain } }
    }
    const updatedAdminControls = await mongoFunctions.findOneAndUpdate("AdminControls", filter, update, { new: true })
    await redis.hSet("cpg_admin", "controls", JSON.stringify(updatedAdminControls))

    return res.status(200).send(await cryptojs.encrypt({ message: "Chain Deleted Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/updateReferral
// @DESC: To update referral in admin controls
admin.post('/updateReferral', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req

    // admin validations
    if(admin.adminType !== "1") return res.status(401).send("You Are Not Allowed To Update Admin Controls")

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.updateReferral(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get admin controls
    let adminControls = await controllers.getAdminControls()

    // update admin controls
    const update = {
        referral: { 
            referralStatus: payload.referralStatus,
            referralPercentage: payload.referralPercentage
        }
    }
    const updatedAdminControls = await mongoFunctions.findOneAndUpdate("AdminControls", { }, update, { new: true })
    await redis.hSet("cpg_admin", "controls", JSON.stringify(updatedAdminControls)) // update in redis

    // update admin
    const updatedAdmin = await mongoFunctions.findOneAndUpdate("Admin", { email: admin.email }, { ip: payload.ip, browserId: payload.browserId }, { new: true })
    await redis.hSet("cpg_admins", admin.email, JSON.stringify(updatedAdmin)) // update in redis

    // alert dev
    telegram.alertDev(`🕹️🔧 Admin controls updated 🔧🕹️ %0A
	referral status --> ${updatedAdminControls.referral?.referralStatus} %0A
	referral percentage --> ${updatedAdminControls.referral?.referralPercentage} %0A
	by --> ${admin.email}`)

    // send encrypted respnse
    return res.status(200).send(await cryptojs.encrypt({ message: "Referral Controls Updated Successfully" }))
}))

// @METHOD: POST
// @ROUTE: /api/admin/updateTicket
// @DESC: To update(reply and close) ticket
admin.post('/updateTicket', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    // get admin
    const { admin } = req

    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.updateTicket(payload)
    if(error) return res.status(400).send(error.details[0].message)

    // get ticket
    const filter = { ticketId: payload.ticketId }
    const ticket = await mongoFunctions.findOne("Ticket", filter)
    if(!ticket) return res.status(400).send("No Ticket Found With Given Ticket ID. Please Try Again")
    if(ticket.status === "CLOSED") return res.status(400).send("Ticket Has Closed")

    // update ticket
    const update = { }
    if(payload.message) {
        update.$push = {
            messages: {
                msgId:await cryptojs.generateRandomString(),
                personId: admin.adminId,
                personName: admin.userName,
                personEmail: admin.email,
                message: payload.message,
                dateTime: new Date()
            }
        }
    }
    if(payload.status) {
        update.status = payload.status
        if(payload.status === "CLOSED") update.closedBy = admin.email
    }
    const updatedTicket = await mongoFunctions.findOneAndUpdate("Ticket", filter, update, { new: true })

    // alert dev
    telegram.alertDev(`🚨🔧 Ticket updated 🔧🚨 %0A
	${payload.status === "CLOSED" ? "🏳️ Ticket closed 🏳️" : ''} %0A
	ticket id --> ${ticket.ticketId} %0A
	admin --> ${admin.email} %0A
	admin type --> ${admin.adminType} %0A
	status --> ${ticket.status} ${ticket.status === "OPEN" ? '🛑' : '🟢'}`)

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ message: "Ticket Updated Successfully", ticket: updatedTicket }))
}))

admin.post('/set_up', asyncFun (async (req, res) => {
    // get admin controls
    let adminControls = await controllers.getAdminControls()

    // create admin
    const adminData = {
        adminId: 'CPG'+await cryptojs.generateRandomString(),
        userName: "cpgadmin",
        email: "cpgadmin@gmail.com",
        password: "Admin@123",
        adminType: "1",
        status: "ACTIVE"
    }

    // hash password
    const salt = await bcrypt.genSalt(10)
    adminData.password = await bcrypt.hash(adminData.password, salt)

    const admin = await mongoFunctions.create("Admin", adminData)
    await redis.hSet("cpg_admins", admin.email, JSON.stringify(admin))

    return res.status(200).send(admin)
}))
// admin get pending withdrawals
// method post
 
admin.post('/get_pending_withdrawals', auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {

    const pending_withdrawals = await mongoFunctions.find("Transaction", {type : "WITHDRAWAL", status: "PENDING" },{_id:0, __v:0,invNo:0})
    return res.status(200).send(pending_withdrawals)


}))


// admin get pending withdrawals
// method post
 
admin.post('/get_success_deposits',auth, authAdmin, slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
    const succesDeposit = await mongoFunctions.find("Transaction", {type : "DEPOSIT", status: "SUCCESS" },{_id:0, __v:0,invNo:0})
    return res.status(200).send(succesDeposit)
}))

// addmin succes withdrawals
// method post
admin.post('/accept_reject_withdrwals', slowDownLimitter, rateLimitter, asyncFun (async (req, res) => {
 
    req.body = {enc : cryptojs.encryptObj(req.body)}
    // get enc
    const { error: payloadError } = validations.getEnc(req.body)
    if(payloadError) return res.status(400).send(payloadError.details[0].message)

    // decrypt payload
    const payload =await cryptojs.decrypt(req.body.enc)
    if(payload === 'tberror') return res.status(400).send("Invalid Encryption String")
    if(!payload || !(Object.keys(payload).length)) return res.status(400).send("Payload Should Not Be Empty")

    // validate payload
    const { error } = validations.approve_reject_withdral(payload)
    if(error) return res.status(400).send(error.details[0].message)

console.log(payload);

        let history = await mongoFunctions.findOne("Transaction", {
            tId: payload.tid,
            // status: "PENDING",
            type: "WITHDRAWAL"
          });
          if (!history) return res.status(400).send("Record Not Found..!");

        //   if(history.status === "SUCCESS") {
            // const withdarwal_obj = 
            // {
            //     type: "WITHDRAWAL",
            //     status: payload.status,
            //     tid: history.tid,
            //     userId: history.userId,
            // }

    await producer.addJob({ type: "AdminApproveCryptoWithdraw", tId: history.tId, userId: history.userId,status: payload.status ,hash : payload.hash} );



        

        //   }
        //   else{



        //   }
    return res.status(200).send(await cryptojs.encrypt({ status: "Request Processing..!" }));


        }))

module.exports = admin;