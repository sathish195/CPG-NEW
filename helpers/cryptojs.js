const CryptoJS = require('crypto-js')

const [password, salt] = [process.env.CRYPTO_PASS, process.env.CRYPTO_SALT]

const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 100
})

function handler(main) {
    return function(data) {
        try {
            return main(data)
        }catch(err) {
            return 'tberror'
        }
    }
}

module.exports = {
    decrypt: handler ((cipherText) => {
        const bytes = CryptoJS.AES.decrypt(cipherText, key.toString())
        return bytes.toString(CryptoJS.enc.Utf8)
    }),
    encryptObj: handler ((obj) => {
        return CryptoJS.AES.encrypt(JSON.stringify(obj), key.toString()).toString()
    }),
    decryptObj: handler ((cipherText) => {
        const bytes = CryptoJS.AES.decrypt(cipherText, key.toString())
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    }),
    generateRandomString: handler((length=7) => {
        const randomBytes = CryptoJS.lib.WordArray.random(length/2);
        const randomString = CryptoJS.enc.Hex.stringify(randomBytes)

        return randomString.toUpperCase();
    }),
    encryptAPI: handler((obj, secret=key.toString()) => {
        const encryptedString = encodeURIComponent(CryptoJS.AES.encrypt(JSON.stringify(obj), secret).toString())
        return encryptedString
    }),
    decryptAPI: handler((encryptedString, secret=key.toString()) => {
        const decryptedString = CryptoJS.AES.decrypt(decodeURIComponent(encryptedString.toString('base64')), secret)
        return JSON.parse(decryptedString.toString(CryptoJS.enc.Utf8))
    }),
}