const cryptojs = require("./cryptojs")
const mongoFunctions = require("./mongoFunctions")
const redis = require("./redis")

// to set precession
const getPrecession = (amount=0, precision) => parseFloat(amount).toFixed(parseInt(precision))

// to get admin controls
const getAdminControls = async () => {
    let adminControls = await redis.hGet("cpg_admin", "controls", "AdminControls", { })
    if(!adminControls) {
        // create admin controls
        const adminControlsData = {
            coins: [
                {
                    coinId: cryptojs.generateRandomString(),
                    coinName: "bitcoin",
                    coinTicker: "BTC",
                    coinStatus: "ENABLE",
                    precision: 8,
                    withdraw: {
                        withdrawMin: 0.0015,
                        withdrawMax: 1,
                        withdrawFee: 2,
                        withdrawStatus: "ENABLE"
                    },
                    deposit: {
                        depositMin: 0.001,
                        depositMax: 1,
                        depositFee: 2,
                        depositStatus: "ENABLE"
                    },
                },
                {
                    coinId: cryptojs.generateRandomString(),
                    coinName: "usdt",
                    coinTicker: "USDT",
                    coinStatus: "ENABLE",
                    precision: 2,
                    withdraw: {
                        withdrawMin: 20,
                        withdrawMax: 10000,
                        withdrawFee: 1,
                        withdrawStatus: "ENABLE"
                    },
                    deposit: {
                        depositMin: 10,
                        depositMax: 15000,
                        depositFee: 5,
                        depositStatus: "ENABLE"
                    },
                },
                {
                    coinId: cryptojs.generateRandomString(),
                    coinName: "usdc",
                    coinTicker: "USDC",
                    coinStatus: "ENABLE",
                    precision: 2,
                    withdraw: {
                        withdrawMin: 20,
                        withdrawMax: 10000,
                        withdrawFee: 2,
                        withdrawStatus: "ENABLE"
                    },
                    deposit: {
                        depositMin: 25,
                        depositMax: 15000,
                        depositFee: 2,
                        depositStatus: "ENABLE"
                    },
                },
            ]
        }
        adminControls = await mongoFunctions.create("AdminControls", adminControlsData)
        
        // save controls in redis
        await redis.hSet("cpg_admin", "controls", JSON.stringify(adminControls))
    }

    return adminControls
}

// to get precesion by coin
const getPrecisionByCoin = (balance, coinName) => {
    // const bal = parseFloat(balance)
    const bal = Number(balance); // safer than parseFloat

    if(coinName === 'bitcoin') return bal.toFixed(8);
    if(coinName === 'ethereum') return bal.toFixed(18);
    return bal.toFixed(2)
}

// to get coin precision
const getCoinPrecision = (coinName) => {
    if(coinName === 'bitcoin') return 8;
    if(coinName === 'ethereum') return 18;
    return 2
}

// to get default balances for user
const getDefaultBalances = (coins=[]) => {
    if(!coins || !coins?.length) return []
    const defaultBalances = coins.map(coin => {
        return { coinId: coin.coinId, coinName: coin.coinName, coinTicker: coin.coinTicker, coinLogo: "", coinStatus: coin.coinStatus, precision: getCoinPrecision(coin.coinName), balance: getPrecisionByCoin(0, coin.coinName) }
    })
    return defaultBalances
}

// to get today start
const getTodayStart = () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return todayStart
}

// to get tmrw start(tomorrow start)
const getTmrwStart = () => {
    let tmrwStart = new Date()
    tmrwStart.setDate(tmrwStart.getDate() + 1)
    tmrwStart.setHours(0, 0, 0, 0)
    return tmrwStart
}

const generateOtp = () => {
    if(process.env.NODE_ENV === 'staging') return '225811'
    return Math.floor(100000 + Math.random() * 900000)
}

module.exports = {
    getAdminControls,
    generateOtp,
    getPrecession,
    getDefaultBalances,
    getTodayStart,
    getTmrwStart,
    getPrecisionByCoin
}