const redis = require('../helpers/redis');

(async () => {
    const results = await redis.set("CPG_ALL_CRONS",true)
    log("Redis CPG_ALL_CRONS set:", results)
  
  })();
  