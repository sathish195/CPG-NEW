const Admin = require("../models/Admin")
const AdminControls = require("../models/AdminControls")
const Ticket = require("../models/Ticket")
const User = require("../models/User")
const Transaction = require("../models/Transaction")
const Statistics = require("../models/stats")
const History = require("../models/History")


module.exports = {
    create: async (collection, document) => await eval(collection).create(document),
    find: async (collection, filter, options) => await eval(collection).find(filter, options?.projection).select(options?.select).sort(options?.sort).skip(options?.skip).limit(options?.limit),
    findOne: async (collection, conditions, options) => await eval(collection).findOne(conditions, options?.projection).select(options?.select).sort(options?.sort),
    updateOne: async (collection, filter, update, options) => await eval(collection).updateOne(filter, update, options),
    updateMany: async (collection, filter, update, options) => await eval(collection).updateMany(filter, update, options),
    deleteOne: async (collection, filter) => await eval(collection).deleteOne(filter),
    deleteMany: async (collection, filter) => await eval(collection).deleteMany(filter),
    findOneAndUpdate: async (collection, conditions, update, options) => await eval(collection).findOneAndUpdate(conditions, update, options),
    findOneAndDelete: async (collection, conditions) => await eval(collection).findOneAndDelete(conditions),
    createDocument: async (collection, body) => {
        collection = eval(collection)
        const document = new collection(body)
        await document.save()
        return document
    },
    countDocuments: async (collection, filter) => await eval(collection).where(filter).countDocuments(),
    aggregate: async (collection, pipeline) => await eval(collection).aggregate(pipeline)
}