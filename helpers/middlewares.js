const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimitter = require('./rateLimitter')
const slowDownLimitter = require('./slowDownLimitter')

module.exports = (app, express) => {
    app.use(cors({
        origin: '*',
        credentials: true
    }))
    app.use(helmet())
    app.use(rateLimitter)
    app.use(compression())
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('tiny'))
    app.use(slowDownLimitter)
}