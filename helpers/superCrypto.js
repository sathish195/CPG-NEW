const forge = require("node-forge");
const fs = require("fs");
const path = require('path')

class Super_crypto {
  constructor() {
    let publicKeyPath = path.join(__dirname, '../public.pem')
    let publicKey_ = fs.readFileSync(
      publicKeyPath,
      "utf8"
    );
    let privateKeyPath = path.join(__dirname, '../private.pem')
    let privateKey_ = fs.readFileSync(
      privateKeyPath,
      "utf8"
    );
    this.publicKey = forge.pki.publicKeyFromPem(publicKey_);
    this.privateKey = forge.pki.privateKeyFromPem(privateKey_);
  }
  encrypt(string) {
    try {
      const encrypted = Buffer.from(
        this.publicKey.encrypt(string, "RSA-OAEP", {
          md: forge.md.sha1.create(),
        })
      ).toString("base64");
      return encrypted;
    } catch (err) {
      console.log("err in encrypt -->", err);
      return "tberror";
    }
  }
  decrypt(enc) {
    try {
      const decrypted = this.privateKey.decrypt(
        Buffer.from(enc, "base64").toString(),
        "RSA-OAEP",
        { md: forge.md.sha1.create() }
      );
      return decrypted;
    } catch (err) {
      console.log("dec err--->", err);
      return "tberror";
    }
  }
  encryptobj(obj) {
    try {
      const encrypted = Buffer.from(
        this.publicKey.encrypt(JSON.stringify(obj), "RSA-OAEP", {
          md: forge.md.sha1.create(),
        })
      ).toString("base64");
      return encrypted;
    } catch (err) {
      console.log("err in encrypt obj -->", err);

      return "tberror";
    }
  }
  decryptobj(enc_obj) {
    try {
      const decrypted = JSON.parse(
        this.privateKey.decrypt(
          Buffer.from(enc_obj, "base64").toString(),
          "RSA-OAEP",
          { md: forge.md.sha1.create() }
        )
      );
      return decrypted;
    } catch (err) {
      console.log("dec obj err--->", err);
      return "tberror";
    }
  }
}
module.exports = new Super_crypto();