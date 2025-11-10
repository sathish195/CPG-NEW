const error = require("../middlewares/error")
const admin = require("../routes/admin/admin")
const googleAuth = require("../routes/common/googleAuth")
const member = require("../routes/common/member")
const user = require("../routes/user/user")
const queue = require('express-queue')

module.exports = (app) => {
    app.get('/', async (req, res) => res.status(200).send(`${process.env.NODE_ENV === "staging" ? "STAGING" : "PRODUCTION"} ::: Welcome To CPG 🚀`))
    app.use('/api/member', member, queue({ activeLimit: 1, queuedLimit: -1 }))
    app.use('/api/user', user, queue({ activeLimit: 1, queuedLimit: -1 }))
    app.use('/api/admin', admin, queue({ activeLimit: 1, queuedLimit: -1 }))
    app.use('/api/googleAuth', googleAuth, queue({ activeLimit: 1, queuedLimit: -1 }))
    app.use(error)
    app.use((req, res) => res.status(404).json({ error: 'Not Found' }))
}