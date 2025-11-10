const axios = require('axios');
const cryptojs = require('../helpers/cryptojs');
const telegram = require('../helpers/telegram');

const secretKey = process.env.CAPTCHA_SECRET_KEY;

module.exports = async function (req, res, next) {
    try {
        // validate captha value
        if (!req.headers['x-captcha-token'] || req.headers['x-captcha-token'] === undefined) return res.status(401).send('Invalid Captcha ..!');

        // get captcha result by decrypting x-captcha-token
        const captchaResult = cryptojs.decrypt(req.headers['x-captcha-token'])
        
        // validate captcha
        const rawResponse = await axios({
            method: 'post',
            url: 'https://www.google.com/recaptcha/api/siteverify',
            data: `secret=${secretKey}&response=`+captchaResult,
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        if(!rawResponse || !rawResponse?.data?.success) return res.status(401).send("Something Went Wrong! Please Try Again")

        next();
    }catch(err) {
        telegram.alertDev(`❌❌❌❌❌❌ \n err in route CPG 👉🏻👉🏻👉🏻 ${req.originalUrl} \n\n ${err.stack}  \n ❌❌❌❌❌❌`)
        return res.status(500).send(err.message)
    }
};