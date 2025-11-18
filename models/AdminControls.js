const mongoose = require('mongoose')

// chain schema
const chainSchema = mongoose.Schema({
    chainId: { type: String, required: true },
    chainName: { type: String, required: true },
    chainLogo: { type: String, default: "" },
    note: { type: String, default: "" },
    fee: { type: Number, required: true, default: 0 },
    min: { type: Number, required: true, default: 0 },
    max: { type: Number, required: true, default: 0 },
    chainStatus: { type: String, required: true, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" }
}, { _id: false })

// coins schema
const coinSchema = mongoose.Schema({
    coinId: { type: String, required: true, unique: true },
    coinName: { type: String, required: true, unique: true },
    coinLogo: { type: String, default: "" },
    coinTicker: { type: String, required: true, unique: true },
    coinStatus: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    note: { type: String, default: "" },
    precision: { type: String, default: 2 },
    withdraw: {
        withdrawMin: { type: Number, default: 0.1 },
        withdrawMax: { type: Number, default: 5 },
        withdrawFee: { type: Number, default: 2 }, // flat
        withdrawStatus: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    },
    deposit: {
        depositMin: { type: Number, default: 0.1 },
        depositMax: { type: Number, default: 20 },
        depositFee: { type: Number, default: 2 },
        depositStatus: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    },
    chains: { type: [chainSchema], default: [] },
    settlementMin: { type: Number, default: 100 },
}, { _id: false })

// admin controls schema
const adminControlsSchema = mongoose.Schema({
    login: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    register: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    withdraw: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
    diposit: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },

    referral: {
        referralStatus: { type: String, enum: { values: ["ENABLE", "DISABLE"], message: "${VALUE} is not supported" }, default: "ENABLE" },
        referralPercentage: { type: Number, default: 0 }
    },
    coins: [coinSchema]
})

const AdminControls = mongoose.model("AdminControls", adminControlsSchema)

module.exports = AdminControls