const mongoose = require('mongoose')
const moment = require('moment')

const adminSchema = mongoose.Schema({
    adminId: { type: String, required: true, unique: true },
    userName: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateOfRegister: { type: Date, required: true, default: new Date(), get: (val) => moment(val).format('DD-MMM-YYYY hh:mm:ssA') },
    ip: { type: String, required: true, default: "0" },
    browserId: { type: String, required: true, default: "0" },
    fcmToken: { type: String, required: this, default: "0" },
    status: { type: String, required: true, enum: { values: ["ACTIVE", "PENDING", "BLOCKED"], message: "${VALUE} is not supported" }, default: "PENDING" },
    tfaKey: { type: String, required: true, default: "0" },
    tfaStatus: { type: String, required: true, enum: { values: ["ENABLE", "DISABLE", "ACTIVE"], message: "${VALUE} is not supported" }, default: "DISABLE" },
    isAdmin: { type: Boolean, required: true, default: true },
    adminType: { type: String, required: true, default: "1" },
    others: { type: Object, required: true, default: {} },
    auth: { type: Array, required: true, default: ["self"] }
}, {
    timestamps: true,
    toJSON: {
        getters: true
    }
})

const Admin = mongoose.model('Admin', adminSchema)

module.exports = Admin