const express = require('express')
const rateLimitter = require('../../helpers/rateLimitter')
const asyncFun = require('../../middlewares/asyncFun')
const { OAuth2Client } = require('google-auth-library')
const axios = require('axios')
const cryptojs = require('../../helpers/cryptojs')
const redis = require('../../helpers/redis')
const jwt = require('../../helpers/jwt')
const mongoFunctions = require('../../helpers/mongoFunctions')
const controllers = require('../../helpers/controllers')
const { alertDev } = require('../../helpers/telegram')

const googleAuth = express.Router()

// credentials
const clientID = process.env.O_AUTH_CLIENT_ID
const clientSecret = process.env.O_AUTH_CLIENT_SECRET
const msg = process.env.O_AUTH_MSG

// app & redirect url
const appUrl = 'https://cpg-project-4bdb3.web.app'
// const redirectUrl = 'https://pze1h729pj.execute-api.us-east-1.amazonaws.com/api/googleAuth/callback';
const redirectUrl = 'https://cpg-new.onrender.com/api/googleAuth/callback';
// get user data by decoding credentials
async function getUserData(accessToken) {
    const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
    if(data) return data
    return null
}
// @METHOD: POST
// @ROUTE: /api/googleAuth/
// @DESC: To open consent screen to signin with google
googleAuth.post('/', rateLimitter, asyncFun (async (req, res) => {
    // get admin controls
    const adminControls = await controllers.getAdminControls()
    if(!adminControls) return res.status(401).send("Admin Controls Are Not Added")

    // get backend url
    const redirect = process.env.NODE_ENV === "staging" ? `${req.protocol}://${req.hostname}/api/googleAuth/callback` : redirectUrl;

    // crete auth2 client
    const auth2Client = new OAuth2Client(clientID, clientSecret, redirect);

    // create consent url to open consent window
    const consentUrl = auth2Client.generateAuthUrl({
        access_type: "offline",
        scope: "https://www.googleapis.com/auth/userinfo.profile  email",
        prompt: "consent",
        include_granted_scopes: true
    })

    // send encrypted response
    return res.status(200).send(await cryptojs.encrypt({ url: consentUrl }))
}))
// @METHOD: GET
// @ROUTE: /api/googlAuth/callback
// @DESC: To get accesstoken & signin/signup from google credentials
googleAuth.get('/callback', rateLimitter, async (req, res) => {
    try {
        // get admin controls
        const adminControls = await controllers.getAdminControls()
        if(!adminControls) return res.status(401).send("Admin Controls Are Not Added");

        // create login, dashbaord & redirect urls
        const loginUrl = `${appUrl}/login`

        // get code
        const { code, error } = req.query
    
        // redirect to home page
        if(!code || error) return res.redirect(`${loginUrl}?err=${encodeURIComponent(cryptojs.encrypt("Something Went Wrong! Try Again"))}`)

        // create redirect url
        const redirect = process.env.NODE_ENV === "staging" ? `${req.protocol}://${req.hostname}/api/googleAuth/callback` : redirectUrl;
    
        // crete auth2 client
        const auth2Client = new OAuth2Client(clientID, clientSecret, redirect);
    
        // get tokens
        const { tokens } = await auth2Client.getToken(code) // get token
    
        // set credentials
        await auth2Client.setCredentials(tokens)
    
        // get access token
        const accessToken = auth2Client.credentials.access_token
        if(!accessToken) return res.redirect(`${loginUrl}?err=${encodeURIComponent(await cryptojs.encrypt("Something Went Wrong! Please Try Again"))}`)

        // get user
        const result = await getUserData(accessToken)
        if(!result) return res.status(400).send("User Data Not Found. Please Try Again")
        if(!result.email_verified) return res.status(400).send("Email Is Not Verified Or Invalid Email. Please Try Again");

        // check member
        let member = await mongoFunctions.findOne("User", { email: result.email }) // in users
        if(!member) {
            member = await mongoFunctions.findOne("Admin", { email: result.email }) // in admins
        }
        if(member && member.status === "BLOCKED") return res.redirect(`${loginUrl}?err=${encodeURIComponent(await cryptojs.encrypt("You Are Not Allowed To Process Current Request! Contact Admin"))}`)

        // Register User || Login member(Admin/User)
        if(!member) {
            // -- user registration --
            // check admin controls
            if(member && member.status === "ENABLE") return res.redirect(`${loginUrl}?err=${encodeURIComponent(await cryptojs.encrypt("Admin Has Disabled User Registration. Please Try Again After Some TIme"))}`)
                const merchantFee = {type:"FLAT", value:0} // default merchant fee

            // create balances from admin controls
            const coins = adminControls.coins
            const balances = controllers.getDefaultBalances(coins)
            // create user data
            const userData = {
                userId: 'CPG'+await cryptojs.generateRandomString(),
                email: result.email,
                balances,
                password: "0",
                // ip: payload.ip,
                // browserId: payload?.broswerId || "0",
                status: "ACTIVE",
                auth: ["google"],
                merchantFee
            }
            member = await mongoFunctions.createDocument("User", userData)
        }else {
            // -- member login --
            if(!member.isAdmin) {
                // check admin controls
                if(adminControls.login !== "ENABLE") return res.redirect(`${loginUrl}?err=${encodeURIComponent(cryptojs.encrypt("Admin Has Disabled Login. Please Try Again After Some TIme"))}`)
            }

            // check google auth in member
            const googleAuthExists = (member.auth.filter(ele => ele === "google"))[0]
            if(!googleAuthExists){
                // update member
                const collection = member.isAdmin ? "Admin" : "User"
                const update = {
                    $push: { auth: "google" },
                    status: "ACTIVE"
                }
                member = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, update, { new: true })

                // update member in redis
                const key = member.isAdmin ? "cpg_admins" : "cpg_users"
                await redis.hSet(key, member.email, JSON.stringify(member))
            }
        }

        // get token
        const jwtToken = jwt.sign(member)
    
        // redirect to app url
        return res.redirect(`${loginUrl}?data=${encodeURIComponent(cryptojs.encrypt(jwtToken))}`)
    }catch(err) {
        alertDev(err)
        return res.redirect(`${appUrl}/login?err=${encodeURIComponent(cryptojs.encrypt(err.message))}`)
    }
})



const client = new OAuth2Client(
    clientID ,
    clientSecret ,
    msg 
  );
  
  
  
  googleAuth.post("/login", asyncFun(async (req, res) => {
  
   const { code } = req.body;
  
   if (!code) {
     return res.status(400).json({ message: "Authorization code missing" });
   }
  // get admin controls
  const adminControls = await controllers.getAdminControls()
  if(!adminControls) return res.status(401).send("Admin Controls Are Not Added");
   // 1️⃣ Exchange auth code for tokens
   const { tokens } = await client.getToken(code);
  
   console.log(tokens,"---------------------->");
  
   if (!tokens) {
     return res.status(400).json({ message: "Invalid Google token" });
   }
  
   // 2️⃣ Verify ID token
   const ticket = await client.verifyIdToken({
     idToken: tokens.id_token,
     audience: clientID
   });
   if(!ticket) {
     return res.status(400).json({ message: "Invalid ID token" });
   }
  
   const result = ticket.getPayload();
  console.log(result,"------------------>");
  if(!result) return res.status(400).send("User Data Not Found. Please Try Again")
  
  
         // check member
         let member = await mongoFunctions.findOne("User", { email: result.email }) // in users
         if(!member) {
             member = await mongoFunctions.findOne("Admin", { email: result.email }) // in admins
         }
         if(member && member.status === "BLOCKED") return res.status(400).send("You Are Not Allowed To Process Current Request! Contact Admin")
  
         // Register User || Login member(Admin/User)
         if(!member) {
             // -- user registration --
             // check admin controls
             if(member && member.status === "ENABLE") return res.status(400).send("Admin Has Disabled User Registration. Please Try Again After Some TIme")
                 const merchantFee = {type:"FLAT", value:0} // default merchant fee
  
             // create balances from admin controls
             const coins = adminControls.coins
             const balances = controllers.getDefaultBalances(coins)
             // create user data
             const userData = {
                 userId: 'CPG'+await cryptojs.generateRandomString(),
                 email: result.email,
                 balances,
                 password: "0",
                 name : result.name,
                 // ip: payload.ip,
                 // browserId: payload?.broswerId || "0",
                 status: "ACTIVE",
                 auth: ["google"],
                 merchantFee
             }
             member = await mongoFunctions.createDocument("User", userData)
         }else {
             // -- member login --
             if(!member.isAdmin) {
                 // check admin controls
                 if(adminControls.login !== "ENABLE") return res.status(400).send("Admin Has Disabled Login. Please Try Again After Some TIme")
             }
  
             // check google auth in member
             const googleAuthExists = (member.auth.filter(ele => ele === "google"))[0]
             if(!googleAuthExists){
                 // update member
                 const collection = member.isAdmin ? "Admin" : "User"
                 const update = {
                     $push: { auth: "google" },
                     status: "ACTIVE"
                 }
                 member = await mongoFunctions.findOneAndUpdate(collection, { email: member.email }, update, { new: true })
  
                 // update member in redis
                 const key = member.isAdmin ? "cpg_admins" : "cpg_users"
                 await redis.hSet(key, member.email, JSON.stringify(member))
             }
         }
  
         // get token
         const jwtToken = jwt.sign(member)
   return res.status(200).json(await cryptojs.encrypt(jwtToken));
  
   
  }))

module.exports = googleAuth