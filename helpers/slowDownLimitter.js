const { slowDown } = require('express-slow-down')

const slowDownLimitter = slowDown({
    windowMs: 1 * 1000, // 1sec --> after 1sec delay reset to 0
    delayAfter: 1, // allow 1 req per 1sec
    delayMs: (hits) => hits * 100,
})

module.exports = slowDownLimitter