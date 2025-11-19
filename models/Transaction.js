const mongoose = require('mongoose')

const transactionSchema = mongoose.Schema({
    tId: { type: String, required: true, default: true },
    invNo: { type: String, default: '' },
    // type: { type: String, required: true, enum: { values: ["DEPOSIT ", "WITHDRAWAL"], message: "${VALUE} is not supported" } },
    type: {
        type: String,
        required: true,
        enum: { values: ["DEPOSIT", "WITHDRAWAL"], message: "${VALUE} is not supported" },
        trim: true,
        uppercase: true
      },      
    userId: { type: String, required: true },
    secret_key: { type: Object, required: true },
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
    comment: { type: String, default:"" },
    status: { type: String, required: true, enum: { values: ["PENDING", "SUCCESS", "FAILED"], message: "${VALUE} is not supported" } },
    others: { type: Object, default: {} }
}, {
    timestamps: true,
    toJSON: {
        getters: true
    }
})

const Transaction = mongoose.model("Transaction", transactionSchema)

module.exports = Transaction