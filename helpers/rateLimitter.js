const limitter = require('express-rate-limit')

// create rate limitter
module.exports = limitter({
    windowMs: 1 * 60 * 1000, // 1min
    max: 100,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
    keyGenerator: async (req, res) => {
        if(req.user) return req.user.userId
        if(req.admin) return req.admin.adminId
        if(req.member) {
            return req.member.isAdmin ? req.member.adminId : req.member.userId
        }
        return req.ip
    }
});