import type { GitHubStats } from './pudim/types'

// Type for Redis client (from ioredis)
// We use a minimal interface to avoid importing the full type in Edge Runtime
type RedisClient = {
  get(key: string): Promise<string | null>
  setex(key: string, seconds: number, value: string): Promise<string>
  quit(): Promise<void>
  on(event: 'ready', callback: () => void): void
  on(event: 'error', callback: (err: Error) => void): void
  on(event: 'close', callback: () => void): void
  on(event: 'end', callback: () => void): void
  status: string
}

// Type for Redis class constructor
type RedisConstructor = new (
  url: string,
  options?: {
    retryStrategy?: (times: number) => number | null
    maxRetriesPerRequest?: number
    enableOfflineQueue?: boolean
  }
) => RedisClient

// Check if we're in a Node.js environment (not Edge Runtime)
// Edge Runtime doesn't support Node.js APIs that ioredis needs
// We check for Node.js-specific globals that don't exist in Edge Runtime
const isNodeRuntime = 
  typeof process !== 'undefined' && 
  typeof process.versions === 'object' && 
  typeof process.versions.node === 'string'

let Redis: RedisConstructor | null = null
let redisClient: RedisClient | null = null
let circuitBreakerOpenUntil: number | null = null

// Lazy load ioredis only in Node.js runtime
async function loadRedis(): Promise<RedisConstructor | null> {
  if (!isNodeRuntime) {
    return null
  }
  
  if (Redis) {
    return Redis
  }

  try {
    const redisModule = await import('ioredis')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Redis = redisModule.default as any as RedisConstructor
    return Redis
  } catch (error) {
    console.error('Failed to load ioredis:', error)
    return null
  }
}

/**
 * Check if circuit breaker is open (Redis should not be used)
 */
function isCircuitBreakerOpen(): boolean {
  if (circuitBreakerOpenUntil === null) {
    return false
  }
  
  const now = Date.now()
  if (now >= circuitBreakerOpenUntil) {
    // Cooldown period expired, reset circuit breaker
    circuitBreakerOpenUntil = null
    return false
  }
  
  return true
}

/**
 * Open circuit breaker (stop using Redis for cooldown period)
 */
function openCircuitBreaker(): void {
  // Cooldown period in milliseconds, default to 5 minutes (300000 ms)
  const cooldownMs = parseInt(process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN || '300000', 10)
  circuitBreakerOpenUntil = Date.now() + cooldownMs
  console.warn(`Redis circuit breaker opened. Will retry after ${cooldownMs / 1000} seconds.`)
}

/**
 * Close circuit breaker (Redis is working again)
 */
function closeCircuitBreaker(): void {
  if (circuitBreakerOpenUntil !== null) {
    circuitBreakerOpenUntil = null
    console.log('Redis circuit breaker closed. Redis is available again.')
  }
}

/**
 * Get or create Redis client instance
 */
async function getRedisClient(): Promise<RedisClient | null> {
  // Check if Redis is enabled via environment variable
  const redisEnabled = process.env.REDIS_ENABLED === 'true'
  
  if (!redisEnabled) {
    return null
  }

  // Check if we're in Node.js runtime (not Edge Runtime)
  if (!isNodeRuntime) {
    return null
  }

  // Check circuit breaker - if open, don't attempt to use Redis
  if (isCircuitBreakerOpen()) {
    return null
  }

  // Load Redis module if not already loaded
  const RedisClass = await loadRedis()
  if (!RedisClass) {
    return null
  }

  // Return existing client if already created and connected
  if (redisClient && redisClient.status === 'ready') {
    return redisClient
  }

  // If client exists but not ready, check if it's in a failed state
  if (redisClient && redisClient.status === 'end') {
    // Client was closed, reset it
    redisClient = null
  }

  // Create new Redis client
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  try {
    redisClient = new RedisClass(redisUrl, {
      retryStrategy: (times: number) => {
        // Retry with exponential backoff, max 3 retries
        if (times > 3) {
          // After max retries, open circuit breaker
          openCircuitBreaker()
          return null // Stop retrying
        }
        return Math.min(times * 50, 2000)
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    })

    // Wait for client to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'))
      }, 5000)

      // Handle connection success
      redisClient!.on('ready', () => {
        clearTimeout(timeout)
        closeCircuitBreaker()
        resolve()
      })

      // Handle connection errors gracefully
      redisClient!.on('error', (err: Error) => {
        clearTimeout(timeout)
        console.error('Redis connection error:', err)
        // Open circuit breaker on connection errors
        openCircuitBreaker()
        reject(err)
      })

      // Handle connection close
      redisClient!.on('close', () => {
        console.warn('Redis connection closed')
      })

      // Handle connection end
      redisClient!.on('end', () => {
        console.warn('Redis connection ended')
        openCircuitBreaker()
      })
    })

    return redisClient
  } catch (error) {
    console.error('Failed to create Redis client:', error)
    openCircuitBreaker()
    redisClient = null
    return null
  }
}

/**
 * Get cache key for a GitHub username (stats data)
 */
function getCacheKey(username: string): string {
  const prefix = process.env.REDIS_PREFIX || 'pudim:github:'
  return `${prefix}${username.toLowerCase()}`
}

/**
 * Get cache key for a badge image
 */
function getBadgeCacheKey(username: string): string {
  const prefix = process.env.REDIS_PREFIX || 'pudim:'
  return `${prefix}badge:${username.toLowerCase()}`
}

/**
 * Get cached GitHub stats
 */
export async function getCachedStats(
  username: string
): Promise<GitHubStats | null> {
  const client = await getRedisClient()
  if (!client) {
    return null
  }

  try {
    const key = getCacheKey(username)
    const cached = await client.get(key)
    
    if (cached) {
      // Successfully read from cache, close circuit breaker if it was open
      closeCircuitBreaker()
      const stats = JSON.parse(cached) as GitHubStats
      console.log(`[Redis Cache] Cache HIT for user "${username}":`, {
        username,
        key,
        followers: stats.followers,
        total_stars: stats.total_stars,
        public_repos: stats.public_repos,
        timestamp: new Date().toISOString(),
      })
      return stats
    }
    
    console.log(`[Redis Cache] Cache MISS for user "${username}":`, {
      username,
      key,
      timestamp: new Date().toISOString(),
    })
    return null
  } catch (error) {
    console.error('[Redis Cache] Error reading from cache:', {
      username,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    // Open circuit breaker on read errors
    openCircuitBreaker()
    return null
  }
}

/**
 * Set cached GitHub stats with TTL
 */
export async function setCachedStats(
  username: string,
  stats: GitHubStats
): Promise<void> {
  const client = await getRedisClient()
  if (!client) {
    console.log(`[Redis Cache] Cache SAVE skipped for user "${username}" (Redis disabled or unavailable):`, {
      username,
      timestamp: new Date().toISOString(),
    })
    return
  }

  try {
    const key = getCacheKey(username)
    // TTL in seconds, default to 5 minutes (300 seconds)
    const ttl = parseInt(process.env.REDIS_TTL || '300', 10)
    
    await client.setex(key, ttl, JSON.stringify(stats))
    // Successfully wrote to cache, close circuit breaker if it was open
    closeCircuitBreaker()
    console.log(`[Redis Cache] Cache SAVE successful for user "${username}":`, {
      username,
      key,
      ttl_seconds: ttl,
      followers: stats.followers,
      total_stars: stats.total_stars,
      public_repos: stats.public_repos,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Redis Cache] Error writing to cache:', {
      username,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_name: error instanceof Error ? error.name : typeof error,
      timestamp: new Date().toISOString(),
    })
    // Open circuit breaker on write errors
    openCircuitBreaker()
    // Don't throw - caching failures shouldn't break the app
  }
}

/**
 * Get cached badge image
 * Returns the image as a Buffer if found in cache
 */
export async function getCachedBadge(
  username: string
): Promise<Buffer | null> {
  const client = await getRedisClient()
  if (!client) {
    return null
  }

  try {
    const key = getBadgeCacheKey(username)
    const cached = await client.get(key)
    
    if (cached) {
      // Successfully read from cache, close circuit breaker if it was open
      closeCircuitBreaker()
      // Badge is stored as base64 string, convert back to Buffer
      return Buffer.from(cached, 'base64')
    }
    
    return null
  } catch (error) {
    console.error('Error reading badge from Redis cache:', error)
    // Open circuit breaker on read errors
    openCircuitBreaker()
    return null
  }
}

/**
 * Set cached badge image with TTL
 * Stores the image buffer as a base64 string
 */
export async function setCachedBadge(
  username: string,
  imageBuffer: Buffer
): Promise<void> {
  const client = await getRedisClient()
  if (!client) {
    return
  }

  try {
    const key = getBadgeCacheKey(username)
    // TTL in seconds, default to 5 minutes (300 seconds)
    const ttl = parseInt(process.env.REDIS_TTL || '300', 10)
    
    // Store as base64 string to preserve binary data
    await client.setex(key, ttl, imageBuffer.toString('base64'))
    // Successfully wrote to cache, close circuit breaker if it was open
    closeCircuitBreaker()
  } catch (error) {
    console.error('Error writing badge to Redis cache:', error)
    // Open circuit breaker on write errors
    openCircuitBreaker()
    // Don't throw - caching failures shouldn't break the app
  }
}

/**
 * Close Redis connection (useful for cleanup)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      // Only try to quit if the client is in a state that allows it
      if (redisClient.status !== 'end' && redisClient.status !== 'close') {
        await redisClient.quit()
      }
    } catch (error) {
      // Ignore errors when closing - client might already be closed
      console.warn('Error closing Redis connection:', error)
    } finally {
      redisClient = null
    }
  }
  // Reset circuit breaker on manual close
  circuitBreakerOpenUntil = null
}
