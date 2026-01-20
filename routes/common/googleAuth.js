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


// const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  process.env.O_AUTH_CLIENT_ID,
  process.env.O_AUTH_CLIENT_SECRET,
  "postmessage" // ✅ REQUIRED for frontend code flow
);
// {
//     "payload": {
//         "iss": "https://accounts.google.com",
//         "azp": "39772886260-vm5m30abdrtbl4gs5qri0v2d7hsnu5rg.apps.googleusercontent.com",
//         "aud": "39772886260-vm5m30abdrtbl4gs5qri0v2d7hsnu5rg.apps.googleusercontent.com",
//         "sub": "106876962935077106802",
//         "email": "sairamakrishna2@gmail.com",
//         "email_verified": true,
//         "at_hash": "Kg6-UEiX3-UJfCZo_nlOPg",
//         "name": "sai Ramakrishna",
//         "picture": "https://lh3.googleusercontent.com/a/ACg8ocKkXiZMnQQfXmg4TtFvF61kSLQzH5b2i9-e-kMAHJZgtLDAnhMt=s96-c",
//         "given_name": "sai",
//         "family_name": "Ramakrishna",
//         "iat": 1768896852,
//         "exp": 1768900452
//     },
//     "tokens": {
//         "access_token": "ya29.a0AUMWg_LDdswCi2dEUerQr4OmACwXf8zy0STF108rsu06AyWXdc90erL94CoKnYI-BRLJz-S3Bt7yHoFdm52ZipBUD1nEEf_8Jt-v-0bNG1YpqWqXmPEq_7VprTNM5U9XXFYqqGkrboJ57szAZjcnQNuJaVlm2QwqxiHyQEDA4z4pXvbAVgIfAvyU329rNguFxVSO_5AaCgYKAQkSARISFQHGX2MiSBAyW3mH1gN3IrMrng-LLg0206",
//         "refresh_token": "1//0gkkh_2c4PlawCgYIARAAGBASNwF-L9IrvVSYOuTolD-L-qEL1W44E1WY4x1_2rWw_SiyDaOoVjooN5G5--NI0FzoV6AKYugAvwE",
//         "scope": "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
//         "token_type": "Bearer",
//         "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdiZjU5NTQ4OWEwYmIxNThiMDg1ZTIzZTdiNTJiZjk4OTFlMDQ1MzgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzOTc3Mjg4NjI2MC12bTVtMzBhYmRydGJsNGdzNXFyaTB2MmQ3aHNudTVyZy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjM5NzcyODg2MjYwLXZtNW0zMGFiZHJ0Ymw0Z3M1cXJpMHYyZDdoc251NXJnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA2ODc2OTYyOTM1MDc3MTA2ODAyIiwiZW1haWwiOiJzYWlyYW1ha3Jpc2huYTJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJLZzYtVUVpWDMtVUpmQ1pvX25sT1BnIiwibmFtZSI6InNhaSBSYW1ha3Jpc2huYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLa1hpWk1uUVFmWG1nNFR0RnZGNjFrU0xRekg1YjJpOS1lLWtNQUhKWmd0TERBbmhNdD1zOTYtYyIsImdpdmVuX25hbWUiOiJzYWkiLCJmYW1pbHlfbmFtZSI6IlJhbWFrcmlzaG5hIiwiaWF0IjoxNzY4ODk2ODUyLCJleHAiOjE3Njg5MDA0NTJ9.H21pSP7DhUrqnIsgbw3GEmmOz-1zpt51cBqZ80WncyE1vvmo2wkuPTck3N-aZTn2Q7qroi-XHfOWkydjE_N3yhT9p5qOQw1_uuX_45lnq1DCW0xjPcKVihoPISt7F2LGvw0us8k_nQKeheQ8tYmYxXbYgreUmnCAAtlEgjpaGsLiw_yk--m0g2qjhlHkCS9QfVdRMtpjtcPVSjgtzUIV8xv9z0f-XIwDsQX3bqdspm4834yyCRICaEAbbQrvEcJX_Yn5PLX6GEkVqEYPJ0XThEyQgoY7SjsNjfa-G57jUeFOHAo92WlXJ_SnSLjbH_mx1OxeA7jAcz1ibqqad6PWUA",
//         "expiry_date": 1768900451743
//     }
// }


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

    // console.log(tokens,"---------------------->");

    if (!tokens.id_token) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    // 2️⃣ Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.O_AUTH_CLIENT_ID,
    });

    const result = ticket.getPayload();
console.log(result,"------------------>");


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