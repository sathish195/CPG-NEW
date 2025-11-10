const mongoose = require('mongoose')
const moment = require('moment')

const messageSchema = mongoose.Schema({
    msgId: { type: String, required: true, unique: true },
    personId: { type: String, required: true },
    personName: { type: String, default: "" },
    personEmail: { type: String, required: true },
    message: { type: String, required: true },
    dateTime: { type: Date, required: true, get: val => val ? moment(val).format('DD-MMM-YYYY hh:mm:ssA') : val }
}, { _id: false })

const ticketSchema = mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, default: "" },
    email: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
    status: { type: String, required: true, enum: { values: ["OPEN", "CLOSED"], message: "${VALUE} is not supported" }, default: "OPEN" },
    closedBy: { type: String, default: "" }
}, {
    timestamps: true,
    toJSON: {
        getters: true
    },
})

const Ticket = mongoose.model("Ticket", ticketSchema)

module.exports = Ticket