import Redis from 'ioredis'

let redisClient = null

// Initialize Redis Client if URL is provided
if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1, // Fail fast if offline
        retryStrategy(times) {
            if (times > 3) {
                console.warn('Redis failed sequentially, disabling cache wrapper...')
                return null // Stop retrying
            }
            return Math.min(times * 50, 2000)
        }
    })

    redisClient.on('error', (err) => {
        console.error('Redis Error:', err.message)
    })
    
    redisClient.on('connect', () => {
        console.log('Redis Cache Connected')
    })
} else {
    console.log('No REDIS_URL provided. Caching will be silently bypassed.')
}

/**
 * Gets a parsed JSON payload from Cache.
 * @param {string} key 
 * @returns {object|null}
 */
export async function getCache(key) {
    if (!redisClient || redisClient.status !== 'ready') return null
    try {
        const data = await redisClient.get(key)
        return data ? JSON.parse(data) : null
    } catch (e) {
        console.error(`GetCache error for key ${key}:`, e.message)
        return null
    }
}

/**
 * Sets a JSON payload to the Cache with a standard TTL.
 * @param {string} key 
 * @param {object} value 
 * @param {number} ttlSeconds Default 300 (5 minutes)
 */
export async function setCache(key, value, ttlSeconds = 300) {
    if (!redisClient || redisClient.status !== 'ready') return
    try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (e) {
        console.error(`SetCache error for key ${key}:`, e.message)
    }
}

/**
 * Invalidates all keys matching a given pattern (e.g., 'cache:dashboard:*')
 * @param {string} pattern 
 */
export async function invalidatePattern(pattern) {
    if (!redisClient || redisClient.status !== 'ready') return
    try {
        const stream = redisClient.scanStream({
            match: pattern,
            count: 100
        })

        stream.on('data', async (keys) => {
            if (keys.length) {
                const pipeline = redisClient.pipeline()
                keys.forEach(k => pipeline.del(k))
                await pipeline.exec()
            }
        })
    } catch (e) {
        console.error(`InvalidatePattern error for ${pattern}:`, e.message)
    }
}
