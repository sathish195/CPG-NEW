const express = require('express')
require('dotenv').config()
require('./helpers/errorHandler')
const dbConnect = require('./helpers/dbConnect')

const app = express()
require('./helpers/appConfig')(app) 
require('./helpers/middlewares')(app, express) 
const axios = require('axios');
// (async function(){

//     var body = {
//       name: "234563245SEDGFEGBFR",
//       key: "a252Ada0908a4a34d33bb5",
//     };
//     const result = await axios({
//       method: "post",
//       url: "http://topbtc-1664110145.us-east-2.elb.amazonaws.com/api/crypt/genaddress",
//       data: body,
//     });
//     console.log(result,"bitcotin-------------------------->")

//     // console.log(result);

//     if (result && result.data && result.data.address) {
//       console.log(result.data);
//       return result.data
      
//     }
//   return false;
// })();


(async function() {
    try {
        var body = {
            name: "erfserjfnerfnhsierf3984",
            key: "a252Ada0908a4a34d33bb5",
        };

        const result = await axios({
            method: "post",
            url: "http://topbtc-1664110145.us-east-2.elb.amazonaws.com/api/crypt/genaddress",
            data: body,
            timeout: 60000        });

        console.log(result, "bitcotin-------------------------->");

        if (result && result.data && result.data.address) {
            console.log(result.data);
            return result.data;
        }

        return false;

    } catch (error) {
        console.error("Error during API request:", error);
        return false;
    }
})();

// require('./helpers/corn')

// // (async () => {
//   const results = await set("CPG_ALL_CRONS",true)

// // })();

dbConnect(app, 8080)