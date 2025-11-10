const tb = require('tiger-balm');

// get salt & pass
const [salt, pass] = [process.env.TB_SALT, process.env.TB_PASS]

module.exports = {
    encryptObj: (obj) => tb.encrypt(salt, pass, JSON.stringify(obj)),
    decryptObj: (encObj) => JSON.parse(tb.decrypt(salt, pass, encObj)),
    encrypt: (text) => tb.encrypt(salt, pass, text),
    decrypt: (encText) => tb.decrypt(salt, pass, encText)
}