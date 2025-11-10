const mongoose = require('mongoose')

const transactionSchema = mongoose.Schema({
    tId: { type: String, required: true, default: true },
    invNo: { type: String, default: '' },
    type: { type: String, required: true, enum: { values: ["CREDIT", "DEBIT"], message: "${VALUE} is not supported" } },
    userId: { type: String, required: true },
    userName: { type: String, default: "" },
    email: { type: String, required: true },
    coinId: { type: String, required: true },
    coinName: { type: String, required: true },
    coinTicker: { type: String, required: true },
    chainId: { type: String, required: true },
    chainName: { type: String, required: true },
    amount: { type: Number, required: true },
    address: { type: String, required: true },
    fee: { type: Number, required: true },
    comment: { type: String, required: true },
    status: { type: String, required: true, enum: { values: ["PENDING", "SUCCESS", "FAILED"], message: "${VALUE} is not supported" } },
}, {
    timestamps: true,
    toJSON: {
        getters: true
    }
})

const Transaction = mongoose.model("Transaction", transactionSchema)

module.exports = Transaction