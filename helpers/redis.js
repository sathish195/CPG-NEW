const redis = require('redis');
const mongoFunctions = require('./mongoFunctions');
const _ = require('lodash')

const [password, host, port] = [process.env.REDIS_PASS, process.env.REDIS_HOST, process.env.REDIS_PORT]

const redisClient = redis.createClient({
    password,
    socket: {
        host,
        port
    }
});

redisClient.connect()

redisClient
    .on('connect', () => {
        console.log("Redis -->", port)
    })
    .on('error', (err) => {
        console.log("Redis Connection Failed", err.message)
    })
    .on('end', () => {
        console.log("Redis Connection Disconnected", port)
    });

    // to return user data for redis
const getUserRedis = (user) => JSON.stringify(_.pick(user, ['userId', 'userName', 'email', 'ip', 'whiteList_ip', 'browserId', 'status', 'withdrawStatus', 'transactionStatus', 'tfaStatus', 'tfaKey', 'auth', 'isAdmin']))

// to return admin data for redis
const getAdminRedis = (admin) => JSON.stringify(_.pick(admin, ['adminId', 'userName', 'email', 'ip', 'whiteList_ip', 'browserId', 'status', 'tfaStatus', 'tfaKey', 'auth', 'isAdmin', 'adminType']))

// to get member based on key for redis
const getMemberForRedis = (key, member) => {
    if(key === "cpg_admins") return getAdminRedis(JSON.parse(member));
    if(key === "cpg_users") return getUserRedis(JSON.parse(member));
    return member
}

// function to set expire time to key
async function setExpire(key) {
    // get ttl time
    let time = await redisClient.TTL(key);
    // set expire time to key(if key has no expire)
    if (time <= -1) await redisClient.expire(key, 86400)
}

module.exports = {
    // to set a key 
    set: async (key, value, expire=true) => {
        // log("Redis Set Key:", key)
        const response = await redisClient.set(key, JSON.stringify(value));
        if(expire) await setExpire(key) // set expire time
        return response
    },

    // to set a key with expire time
    setEx: async (key, value, time) => await redisClient.setEx(key, time, JSON.stringify(value)),

    // to get a key
    get: async (key, collection, filter={}) => {
        // check key
        const keyExists = await redisClient.exists(key)
        if(keyExists) {
            // get result from redis
            const result = await redisClient.get(key)
            if(result) return JSON.parse(result)
        }
    
        // get result from db
        if(collection) {
            const result = await mongoFunctions.find(collection, filter)
            if(!result || !result.length) return null

            // set result to redis
            await redisClient.set(key, JSON.stringify(result))
            await setExpire(key) // set expire time

            return result
        }
        
        return null
    },

    // to check key exists
    exists: async (key) => await redisClient.exists(key),

    // to set a field to hash
    hSet: async (key, field, value) => {
        if(!value) return null;
        const finalVal = getMemberForRedis(key, value)
        const response = await redisClient.hSet(key, field, finalVal)
        if(key !== "cpg_admin" && field !== "controls") await setExpire(key) // set expire time
        return response
    },

    // to get a field from hash
    hGet: async (key, field, collection='', filter='') => {
        const keyExists = await redisClient.exists(key)
        if(keyExists) {
            // get result
            const result = JSON.parse(await redisClient.hGet(key, field))
            if(result) return result
        }

        // get result from db
        if(collection && filter) {
            const result = await mongoFunctions.findOne(collection, filter)
            if(!result) return null

            // save result to redis
            const finalVal = getMemberForRedis(key, JSON.stringify(result))
            await redisClient.hSet(key, field, finalVal)
            if(collection !== "AdminControls") await setExpire(key)
            
            return result
        }

        return null
    },

    // to delte field from hash
    hDel: async (key, field) => await redisClient.hDel(key, field),
    
    // to delete a key
    delete: async (key) => await redisClient.del(key),

    // to reset all redis cache
    flushAll: async () => await redisClient.flushAll(),
}