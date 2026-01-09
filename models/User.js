const mongoose = require('mongoose')
const moment = require('moment')

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    userName: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateOfRegister: { type: Date, required: true, default: new Date(), get: (val) => moment(val).format('DD-MMM-YYYY hh:mm:ssA') },
    ip: { type: String, required: true, default: "0" },
    whiteList_ip: { type: [String], required: true, default: [] },
    browserId: { type: String, required: true, default: "0" },
    fcmToken: { type: String, required: this, default: "0" },
    status: { type: String, required: true, enum: { values: ["ACTIVE", "PENDING", "BLOCKED"], message: "${VALUE} is not supported" }, default: "PENDING" },
    tfaKey: { type: String, required: true, default: "0" },
    tfaStatus: { type: String, required: true, enum: { values: ["ENABLE", "DISABLE","PENDING"], message: "${VALUE} is not supported" }, default: "PENDING" },
    referralId: { type: String, required: true, default: "0" },
    referralStatus: { type: String, required: true, enum: { values: ["ACTIVE", "PENDING"], message: "${VALUE} is not supported" }, default: "PENDING" },
    keys: {
        type: [{
            _id: false,
            appKey: { type: String, required: true },
            secretKey: { type: String, required: true },
            appName: { type: String, required: true, },
            appId: { type: String, required: true },
            successUrl: { type: String, required: true },
            notifyUrl: { type: String, required: true },
            whiteList_ip: { type: [String], default: [] }
        }],
        default: []
    },
    balances: {
        type: [{
            _id: false,
            coinId: { type: String, required: true },
            coinName: { type: String, required: true },
            coinTicker: { type: String, required: true },
            coinLogo: { type: String, default: "" },
            coinStatus: { type: String },
            precision: { type: String, default: 2 },
            balance: { type: String, default: 0 },
            settlement: {
                settlementType: { type: String, enum: { values: ["", "MONTHLY", "AMOUNT"], message: "${VALUE} is not supported" }, default: "" },
                settlementIn: { type: Number, default: 0 },
                address: { type: String, default: "" },
                settlementStatus: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "DISABLE" }
            }
        }],
        default: []
    },
    transactionStatus: { type: String, required: true, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    withdrawStatus: { type: String, required: true, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    others: { type: Object, required: true, default: {} },
    isAdmin: { type: Boolean, required: true, default: false },
    auth: { type: Array, required: true, default: ["self"] },
    // merchantFee: { type: mongoose.Schema.Types.Decimal128, default: 2 },
    merchantFee  : { type: Object, default: {} },



}, {
    timestamps: true,
    toJSON: {
        getters: true
    },
})

const User = mongoose.model('User', UserSchema)

module.exports = User