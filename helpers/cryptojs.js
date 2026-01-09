// const CryptoJS = require('crypto-js')

// const [password, salt] = [process.env.CRYPTO_PASS, process.env.CRYPTO_SALT]

// const key = CryptoJS.PBKDF2(password, salt, {
//     keySize: 256/32,
//     iterations: 100
// })

// function handler(main) {
//     return function(data) {
//         try {
//             return main(data)
//         }catch(err) {
//             return 'tberror'
//         }
//     }
// }

// module.exports = {
//     decrypt: handler ((cipherText) => {
//         const bytes = CryptoJS.AES.decrypt(cipherText, key.toString())
//         return bytes.toString(CryptoJS.enc.Utf8)
//     }),
//     encryptObj: handler ((obj) => {
//         return CryptoJS.AES.encrypt(JSON.stringify(obj), key.toString()).toString()
//     }),
//     decryptObj: handler ((cipherText) => {
//         const bytes = CryptoJS.AES.decrypt(cipherText, key.toString())
//         return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
//     }),
//     generateRandomString: handler((length=7) => {
//         const randomBytes = CryptoJS.lib.WordArray.random(length/2);
//         const randomString = CryptoJS.enc.Hex.stringify(randomBytes)

//         return randomString.toUpperCase();
//     }),
//     encryptAPI: handler((obj, secret=key.toString()) => {
//         const encryptedString = encodeURIComponent(CryptoJS.AES.encrypt(JSON.stringify(obj), secret).toString())
//         return encryptedString
//     }),
//     decryptAPI: handler((encryptedString, secret=key.toString()) => {
//         const decryptedString = CryptoJS.AES.decrypt(decodeURIComponent(encryptedString.toString('base64')), secret)
//         return JSON.parse(decryptedString.toString(CryptoJS.enc.Utf8))
//     }),
// }


// ---------new file cryptojs.js ends here ---------

require("dotenv").config();
const { webcrypto } = require("crypto");

global.crypto = webcrypto;

// ================= CONFIG =================
const PASSWORD = "Sectrect_pass!234__UYGLAISBCI";

const ITERATIONS = 150000;

const MAX_AGE_MS = 10 * 60 * 1000;

const usedNonces = new Set();

async function deriveKey(password, salt) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encrypt(userData) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const key = await deriveKey(PASSWORD, salt);

  // 🔒 Internal security metadata
  const payload = {
    data: userData, // actual business data
    ts: Date.now(), // timestamp
    nonce: crypto.randomUUID(), // one-time token
  };

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(payload))
  );

  return Buffer.from(
    JSON.stringify({
      v: 1,
      salt: Array.from(salt),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    })
  ).toString("base64");
}
async function decrypt(cipherText) {
  const payload = JSON.parse(Buffer.from(cipherText, "base64").toString());

  const key = await deriveKey(PASSWORD, new Uint8Array(payload.salt));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
    key,
    new Uint8Array(payload.data)
  );

  const decoded = JSON.parse(new TextDecoder().decode(decrypted));
  console.log("decoded--->",decoded);
  console.log({
    ts:decoded.ts,dt: Date.now(),diff:  Date.now()-decoded.ts ,mx: MAX_AGE_MS
  });
  if (!decoded.ts || Date.now() - decoded.ts > MAX_AGE_MS) {
    throw new Error("Request expired (replay blocked)");
  }

  if (usedNonces.has(decoded.nonce)) {
    throw new Error("Replay attack detected");
  }

  usedNonces.add(decoded.nonce);
  return decoded.data;
}
async function jwt_decrypt(cipherText) {
    const payload = JSON.parse(Buffer.from(cipherText, "base64").toString());
  
    const key = await deriveKey(PASSWORD, new Uint8Array(payload.salt));
  
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
      key,
      new Uint8Array(payload.data)
    );
  
    const decoded = JSON.parse(new TextDecoder().decode(decrypted));
    // if (!decoded.ts || Date.now() - decoded.ts > MAX_AGE_MS) {
    //   throw new Error("Request expired (replay blocked)");
    // }
  
    // if (usedNonces.has(decoded.nonce)) {
    //   throw new Error("Replay attack detected");
    // }
  
    // usedNonces.add(decoded.nonce);
    return decoded.data;
  }

  //  function generateRandomString(length=7)  {
  //       const randomBytes = CryptoJS.lib.WordArray.random(length/2);
  //       const randomString = CryptoJS.enc.Hex.stringify(randomBytes)

  //       return randomString.toUpperCase();
  //   }

    async function generateRandomString(length = 7) {
      const randomBytes = crypto.getRandomValues(new Uint8Array(length / 2)); // Generates random bytes
      let randomString = '';
  
      // Convert random bytes to hex string (each byte is two hex characters)
      for (let i = 0; i < randomBytes.length; i++) {
          randomString += randomBytes[i].toString(16).padStart(2, '0').toUpperCase();
      }
  
      return randomString;
  }
  

module.exports = {
  encrypt,
  decrypt,
  jwt_decrypt,
  generateRandomString
};