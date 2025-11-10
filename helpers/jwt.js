const jwt = require('jsonwebtoken')
const _ = require('lodash')

const privateKey = process.env.PRIVATE_KEY

module.exports = {
    sign: (member) => {
        const signData = member.isAdmin ? ['adminId', 'adminType'] : ['userId']
        const signInfo = _.pick(member, [...signData, 'userName', 'email', 'tfaStatus', 'isAdmin', 'auth'])
        return jwt.sign(signInfo, privateKey, { expiresIn: '1hr' }) // prev: '600' --> 10min
    },
    verify: (token) => jwt.verify(token, privateKey),
    decode: (token) => jwt.decode(token, privateKey)
}