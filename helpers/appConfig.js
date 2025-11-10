module.exports = (app) => {
    app.set('trust proxy', 1)
    process.setMaxListeners(0)
}