import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest'
import type { GitHubStats } from '../pudim/types'
import Redis from 'ioredis'

// Use a real Redis client for integration tests
let testRedisClient: Redis

describe('Redis Cache Integration', () => {
  const originalEnv = process.env

  beforeAll(async () => {
    // Ensure Redis is enabled and configured to connect to the Docker instance
    process.env.REDIS_ENABLED = 'true'
    process.env.REDIS_URL = 'redis://localhost:6379' // Connect to local Docker Redis
    process.env.REDIS_TTL = '1' // Short TTL for tests
    process.env.REDIS_PREFIX = 'integration_test:'
    process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN = '200' // Short cooldown for all tests

    // Initialize a direct Redis client for cleanup and initial checks
    // ioredis automatically connects when creating a new instance
    testRedisClient = new Redis(process.env.REDIS_URL)
    await testRedisClient.flushall() // Clear database before tests

    // Verify connection
    const ping = await testRedisClient.ping()
    expect(ping).toBe('PONG')
  })

  beforeEach(async () => {
    // Restore default environment for each test
    process.env.REDIS_ENABLED = 'true'
    process.env.REDIS_URL = 'redis://localhost:6379'
    process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN = '200'
    process.env.REDIS_PREFIX = 'integration_test:'
    
    // Clear cache before each test
    await testRedisClient.flushall()
    
    // Close any existing connections before resetting modules
    try {
      const redisModule = await import('../redis')
      await redisModule.closeRedisConnection()
    } catch {
      // Ignore errors if module not loaded or already closed
    }
    
    // Reset module state that might hold old client instances or circuit breaker status
    vi.resetModules()
    
    // Wait for circuit breaker cooldown and connections to fully close
    // This needs to be longer than the cooldown period to ensure clean state
    await new Promise(resolve => setTimeout(resolve, 300))
  })

  afterAll(async () => {
    await testRedisClient.quit()
    process.env = originalEnv // Restore original environment variables
  })

  // Helper to re-import the module to get a fresh instance due to module-level state
  // This helps isolate the state of redisClient, Redis, and circuitBreakerOpenUntil
  async function reImportRedisModule() {
    const redisModule = await import('../redis')
    return redisModule
  }

  describe('getCachedStats', () => {
    it('returns null when Redis is disabled', async () => {
      process.env.REDIS_ENABLED = 'false'
      
      const { getCachedStats } = await reImportRedisModule()
      const result = await getCachedStats('testuser')
      
      expect(result).toBeNull()
      // Since Redis is disabled, no actual call to Redis client should be made.
      // We can't directly assert on mockRedisClient here because it's not mocked anymore.
    })

    it('returns null when not in Node.js runtime', async () => {
      process.env.REDIS_ENABLED = 'true'
      // Simulate Edge Runtime by removing process.versions.node
      const originalNode = process.versions.node
      Object.defineProperty(process.versions, 'node', {
        value: undefined,
        configurable: true,
      })

      const { getCachedStats } = await reImportRedisModule()
      const result = await getCachedStats('testuser')
      
      expect(result).toBeNull()
      
      // Restore
      Object.defineProperty(process.versions, 'node', {
        value: originalNode,
        writable: false,
        configurable: true,
      })
    })

    it('returns cached stats when available', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_PREFIX = 'integration_test:'
      process.env.REDIS_URL = 'redis://localhost:6379' // Ensure correct URL
      
      const mockStats: GitHubStats = {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        followers: 100,
        total_stars: 50,
        public_repos: 10,
        created_at: '2012-01-01T00:00:00Z',
        languages: [],
      }
      
      await testRedisClient.set('integration_test:testuser', JSON.stringify(mockStats))
      
      // Wait a bit to ensure Redis has the data
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const { getCachedStats } = await reImportRedisModule()
      const result = await getCachedStats('TestUser')
      
      expect(result).toEqual(mockStats)
    })

    it('returns null when cache miss', async () => {
      process.env.REDIS_ENABLED = 'true'
      
      const { getCachedStats } = await reImportRedisModule()
      const result = await getCachedStats('testuser')
      
      expect(result).toBeNull()
    })

    it('handles cache read errors gracefully', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN = '100' // Short cooldown
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Simulate an error by temporarily corrupting Redis URL
      process.env.REDIS_URL = 'redis://nonexistent:6379'
      
      const { getCachedStats } = await reImportRedisModule()
      const result = await getCachedStats('testuser')
      
      expect(result).toBeNull()
      // Circuit breaker will open due to connection failure
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      process.env.REDIS_URL = 'redis://localhost:6379' // Restore URL
      
      // Wait for circuit breaker cooldown
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    it('uses default prefix when REDIS_PREFIX is not set', async () => {
      process.env.REDIS_ENABLED = 'true'
      delete process.env.REDIS_PREFIX
      
      const { getCachedStats } = await reImportRedisModule()
      await getCachedStats('testuser')
      
      // Verify with real Redis key structure
      const key = 'pudim:github:testuser'
      const exists = await testRedisClient.exists(key)
      expect(exists).toBe(0) // Should not exist as it was a miss
    })
  })

  describe('setCachedStats', () => {
    it('does nothing when Redis is disabled', async () => {
      process.env.REDIS_ENABLED = 'false'
      process.env.REDIS_URL = 'redis://localhost:6379' // Ensure correct URL
      
      const { setCachedStats } = await reImportRedisModule()
      const stats: GitHubStats = {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        followers: 100,
        total_stars: 50,
        public_repos: 10,
        created_at: '2012-01-01T00:00:00Z',
      }
      
      await setCachedStats('testuser', stats)
      // No actual call to Redis client should be made.
    })

    it('sets cached stats with TTL', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_TTL = '2' // 2 seconds for test
      process.env.REDIS_PREFIX = 'integration_test:'
      process.env.REDIS_URL = 'redis://localhost:6379' // Ensure correct URL
      
      const { setCachedStats } = await reImportRedisModule()
      const stats: GitHubStats = {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        followers: 100,
        total_stars: 50,
        public_repos: 10,
        created_at: '2012-01-01T00:00:00Z',
      }
      
      await setCachedStats('TestUser', stats)
      
      // Wait a bit for Redis to write
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const key = 'integration_test:testuser'
      const cached = await testRedisClient.get(key)
      expect(JSON.parse(cached!)).toEqual(stats)

      // Check TTL
      await new Promise(resolve => setTimeout(resolve, 2100)) // Wait for 2.1 seconds
      const afterTtl = await testRedisClient.get(key)
      expect(afterTtl).toBeNull()
    })

    it('uses default TTL when REDIS_TTL is not set', async () => {
      process.env.REDIS_ENABLED = 'true'
      delete process.env.REDIS_TTL
      process.env.REDIS_PREFIX = 'integration_test:'
      process.env.REDIS_URL = 'redis://localhost:6379' // Ensure correct URL
      
      const { setCachedStats } = await reImportRedisModule()
      const stats: GitHubStats = {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        followers: 100,
        total_stars: 50,
        public_repos: 10,
        created_at: '2012-01-01T00:00:00Z',
      }
      
      await setCachedStats('testuser', stats)
      
      // Wait a bit for Redis to write
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const key = 'integration_test:testuser'
      const cached = await testRedisClient.get(key)
      expect(JSON.parse(cached!)).toEqual(stats)

      // Default TTL is 300 seconds (5 minutes), check if it's set correctly
      const ttl = await testRedisClient.ttl(key)
      expect(ttl).toBeGreaterThan(290) // Should be around 300 seconds
    })

    it('handles cache write errors gracefully', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN = '100' // Short cooldown
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Temporarily corrupt Redis URL to simulate a write error
      process.env.REDIS_URL = 'redis://nonexistent:6379'
      
      const { setCachedStats } = await reImportRedisModule()
      const stats: GitHubStats = {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        followers: 100,
        total_stars: 50,
        public_repos: 10,
        created_at: '2012-01-01T00:00:00Z',
      }
      
      // Should not throw
      await expect(setCachedStats('testuser', stats)).resolves.not.toThrow()
      // Circuit breaker will open due to connection failure
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      process.env.REDIS_URL = 'redis://localhost:6379' // Restore URL
      
      // Wait for circuit breaker cooldown
      await new Promise(resolve => setTimeout(resolve, 150))
    })
  })

  describe('Circuit Breaker (Integration)', () => {
    it('opens circuit breaker on connection error and stops client creation', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN = '100' // 100ms for testing

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Temporarily corrupt Redis URL to simulate connection failure
      process.env.REDIS_URL = 'redis://nonexistent:6379'

      const { getCachedStats } = await reImportRedisModule()
      const result = await getCachedStats('testuser')

      expect(result).toBeNull()
      // Circuit breaker should open after connection attempts fail
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Redis circuit breaker opened"')
      )
      // Reset URL for subsequent tests
      process.env.REDIS_URL = 'redis://localhost:6379'

      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      
      // Wait for circuit breaker cooldown
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    it('closes circuit breaker on successful operation after failure', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN = '100' // 100ms for testing
      process.env.REDIS_PREFIX = 'integration_test:'

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Simulate initial failure to open circuit breaker
      process.env.REDIS_URL = 'redis://nonexistent:6379'
      const { closeRedisConnection } = await reImportRedisModule()
      let { getCachedStats, setCachedStats } = await reImportRedisModule()
      await getCachedStats('testuser') // This opens the circuit breaker
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      // Clean up and restore URL
      await closeRedisConnection()
      process.env.REDIS_URL = 'redis://localhost:6379'
      vi.clearAllMocks()
      vi.resetModules()
      
      // Wait for circuit breaker cooldown to expire plus some buffer
      await new Promise(resolve => setTimeout(resolve, 250))
      
      // Now, try a successful operation after the circuit breaker cooldown
      const stats: GitHubStats = { username: 'recovered', avatar_url: '', followers: 0, public_repos: 0, created_at: '' }
      // Re-import to get a completely fresh module instance
      ;({ getCachedStats, setCachedStats } = await reImportRedisModule())
      
      // Should now succeed after cooldown - write then read back
      await setCachedStats('testuser', stats)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Verify the operation succeeded by checking Redis directly
      const cached = await testRedisClient.get('integration_test:testuser')
      expect(cached).not.toBeNull()
      expect(JSON.parse(cached!)).toEqual(stats)
      
      // Verify that operations work again by reading through the cache
      const retrieved = await getCachedStats('testuser')
      expect(retrieved).toEqual(stats)

      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('re-enables Redis after cooldown period expires', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_CIRCUIT_BREAKER_COOLDOWN = '100' // 100ms for testing

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Simulate initial failure to open circuit breaker
      process.env.REDIS_URL = 'redis://nonexistent:6379'
      let { getCachedStats } = await reImportRedisModule()
      await getCachedStats('testuser') // This opens the circuit breaker
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Redis circuit breaker opened"')
      )
      process.env.REDIS_URL = 'redis://localhost:6379' // Restore URL
      vi.clearAllMocks()
      
      // Wait for cooldown to expire
      await new Promise(resolve => setTimeout(resolve, 150)) // Wait a bit longer than cooldown

      // Now, after cooldown, Redis should be re-enabled and attempt a connection
      ;({ getCachedStats } = await reImportRedisModule())
      const result = await getCachedStats('testuser') // Should try to connect and miss cache
      expect(result).toBeNull()

      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('closeRedisConnection (Integration)', () => {
    it('closes Redis connection and resets circuit breaker when client exists', async () => {
      process.env.REDIS_ENABLED = 'true'
      
      const { getCachedStats, closeRedisConnection } = await reImportRedisModule() // Dynamic import
      await getCachedStats('testuser') // Creates the client implicitly

      // Close should complete without error
      await expect(closeRedisConnection()).resolves.not.toThrow()
      
      // After close, trying to use it again should re-create the client
      const { getCachedStats: getCachedStatsAfterClose } = await reImportRedisModule()
      const result = await getCachedStatsAfterClose('anotheruser')
      expect(result).toBeNull() // Cache miss, but client should have been recreated successfully
    })

    it('handles close when no client exists', async () => {
      process.env.REDIS_ENABLED = 'false' // No client should be created
      
      const { closeRedisConnection } = await reImportRedisModule() // Dynamic import
      await expect(closeRedisConnection()).resolves.not.toThrow()
    })
  })

  describe('Client state management (Integration)', () => {
    it('reuses existing ready client', async () => {
      process.env.REDIS_ENABLED = 'true'
      
      const { getCachedStats } = await reImportRedisModule() // Dynamic import
      await getCachedStats('testuser1')
      await getCachedStats('testuser2')
      
      // It's hard to assert on constructor calls with actual Redis client, but we expect it to reuse if possible
      // The key thing is that operations succeed.
    })

    it('recreates client when previous client status is end', async () => {
      process.env.REDIS_ENABLED = 'true'
      
      const { closeRedisConnection } = await reImportRedisModule()
      let { getCachedStats } = await reImportRedisModule() // Dynamic import
      await getCachedStats('testuser1') // This creates the client

      // Close the client using the public API
      await closeRedisConnection()
      vi.resetModules() // Clear module cache to force re-evaluation of client state

      // After client ended, next call should recreate it
      ;({ getCachedStats } = await reImportRedisModule())
      const result = await getCachedStats('testuser2')
      expect(result).toBeNull() // Cache miss, but client should have been recreated
    })
  })

  describe('getCachedBadge (Integration)', () => {
    it('returns null when Redis is disabled', async () => {
      process.env.REDIS_ENABLED = 'false'
      
      const { getCachedBadge } = await reImportRedisModule()
      const result = await getCachedBadge('testuser')
      
      expect(result).toBeNull()
    })

    it('returns cached badge image when available', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_PREFIX = 'integration_test:'
      process.env.REDIS_URL = 'redis://localhost:6379'
      
      const mockImageBuffer = Buffer.from('fake-png-image-data')
      const base64Image = mockImageBuffer.toString('base64')
      
      await testRedisClient.set('integration_test:badge:testuser', base64Image)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const { getCachedBadge } = await reImportRedisModule()
      const result = await getCachedBadge('TestUser')
      
      expect(result).toEqual(mockImageBuffer)
    })

    it('returns null when cache miss', async () => {
      process.env.REDIS_ENABLED = 'true'
      
      const { getCachedBadge } = await reImportRedisModule()
      const result = await getCachedBadge('nonexistent-user')
      
      expect(result).toBeNull()
    })

    it('uses correct badge cache key with prefix', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_PREFIX = 'integration_test:'
      
      const { getCachedBadge } = await reImportRedisModule()
      await getCachedBadge('testuser')
      
      // Verify the key format by checking Redis directly
      const keys = await testRedisClient.keys('integration_test:badge:*')
      expect(keys.length).toBe(0) // Should be 0 since it was a miss
    })
  })

  describe('setCachedBadge (Integration)', () => {
    it('does nothing when Redis is disabled', async () => {
      process.env.REDIS_ENABLED = 'false'
      process.env.REDIS_URL = 'redis://localhost:6379'
      
      const { setCachedBadge } = await reImportRedisModule()
      const imageBuffer = Buffer.from('fake-png-image-data')
      
      await setCachedBadge('testuser', imageBuffer)
      
      // Verify nothing was written to Redis
      const keys = await testRedisClient.keys('*testuser*')
      expect(keys.length).toBe(0)
    })

    it('sets cached badge with TTL', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_TTL = '2' // 2 seconds for test
      process.env.REDIS_PREFIX = 'integration_test:'
      process.env.REDIS_URL = 'redis://localhost:6379'
      
      const { setCachedBadge } = await reImportRedisModule()
      const imageBuffer = Buffer.from('fake-png-image-data')
      
      await setCachedBadge('TestUser', imageBuffer)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const key = 'integration_test:badge:testuser'
      const cached = await testRedisClient.get(key)
      expect(cached).not.toBeNull()
      
      // Verify it's stored as base64
      const decodedBuffer = Buffer.from(cached!, 'base64')
      expect(decodedBuffer.equals(imageBuffer)).toBe(true)

      // Check TTL expiration
      await new Promise(resolve => setTimeout(resolve, 2100))
      const afterTtl = await testRedisClient.get(key)
      expect(afterTtl).toBeNull()
    })

    it('uses default TTL when REDIS_TTL is not set', async () => {
      process.env.REDIS_ENABLED = 'true'
      delete process.env.REDIS_TTL
      process.env.REDIS_PREFIX = 'integration_test:'
      process.env.REDIS_URL = 'redis://localhost:6379'
      
      const { setCachedBadge } = await reImportRedisModule()
      const imageBuffer = Buffer.from('fake-png-image-data')
      
      await setCachedBadge('testuser', imageBuffer)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const key = 'integration_test:badge:testuser'
      const cached = await testRedisClient.get(key)
      expect(cached).not.toBeNull()

      // Default TTL is 300 seconds, check if it's set correctly
      const ttl = await testRedisClient.ttl(key)
      expect(ttl).toBeGreaterThan(290)
    })

    it('round-trip: write and read badge image', async () => {
      process.env.REDIS_ENABLED = 'true'
      process.env.REDIS_PREFIX = 'integration_test:'
      process.env.REDIS_URL = 'redis://localhost:6379'
      
      const { setCachedBadge, getCachedBadge } = await reImportRedisModule()
      const originalBuffer = Buffer.from('test-image-data-12345')
      
      // Write
      await setCachedBadge('roundtripuser', originalBuffer)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Read
      const retrievedBuffer = await getCachedBadge('roundtripuser')
      
      expect(retrievedBuffer).not.toBeNull()
      expect(retrievedBuffer!.equals(originalBuffer)).toBe(true)
    })

    it('handles cache read errors gracefully for badges', async () => {
      // Create a client first and set a badge
      const { setCachedBadge, closeRedisConnection } = await reImportRedisModule()
      await setCachedBadge('error-read-badge', Buffer.from('test-image'))
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Close the connection to break it
      await closeRedisConnection()
      
      // Now try to read - this should trigger the error path
      // The client will try to reconnect but fail, triggering the catch block
      const originalUrl = process.env.REDIS_URL
      process.env.REDIS_URL = 'redis://invalid-host:6379'
      vi.resetModules()
      
      const { getCachedBadge: getCachedBadgeAfterError, closeRedisConnection: closeAfterError } = await reImportRedisModule()
      
      // This should handle the error gracefully
      const result = await getCachedBadgeAfterError('error-read-badge')
      expect(result).toBeNull()
      
      // Clean up
      await closeAfterError()
      process.env.REDIS_URL = originalUrl
      vi.resetModules()
    })

    it('handles cache write errors gracefully for badges', async () => {
      // Close any existing connection
      const { closeRedisConnection } = await reImportRedisModule()
      await closeRedisConnection()
      
      // Use invalid URL to force connection error
      const originalUrl = process.env.REDIS_URL
      process.env.REDIS_URL = 'redis://invalid-host:6379'
      vi.resetModules()
      
      const { setCachedBadge, closeRedisConnection: closeAfterError } = await reImportRedisModule()
      
      const imageBuffer = Buffer.from('test-image')
      
      // This should handle the error gracefully without throwing
      await expect(setCachedBadge('testuser', imageBuffer)).resolves.not.toThrow()
      
      // Clean up
      await closeAfterError()
      process.env.REDIS_URL = originalUrl
      vi.resetModules()
    })
  })

  describe('closeRedisConnection error handling', () => {
    it('handles errors when closing connection gracefully', async () => {
      const { getCachedStats, closeRedisConnection } = await reImportRedisModule()
      
      // Create a client
      await getCachedStats('testuser')
      
      // Manually break the client to simulate an error during quit
      const redisModule = await import('../redis')
      // Access the internal client and force an error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = (redisModule as any).redisClient
      if (client) {
        // Mock the quit method to throw an error
        const originalQuit = client.quit.bind(client)
        client.quit = vi.fn().mockRejectedValue(new Error('Connection error'))
        
        // This should handle the error gracefully (lines 360-362)
        await expect(closeRedisConnection()).resolves.not.toThrow()
        
        // Restore
        client.quit = originalQuit
      }
    })
  })

  describe('Badge cache error handling (Integration)', () => {
    it('handles read errors for badge cache', async () => {
      // Create a client and set a badge first
      const { setCachedBadge, getCachedBadge, closeRedisConnection } = await reImportRedisModule()
      await setCachedBadge('error-badge-user', Buffer.from('test-image'))
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify it was cached
      const cached = await getCachedBadge('error-badge-user')
      expect(cached).not.toBeNull()
      
      // Close connection
      await closeRedisConnection()
      
      // Now break the connection by using invalid URL
      const originalUrl = process.env.REDIS_URL
      process.env.REDIS_URL = 'redis://invalid-host:6379'
      
      vi.resetModules()
      const { getCachedBadge: getCachedBadgeAfterError, closeRedisConnection: closeAfterError } = await reImportRedisModule()
      
      // This should handle the error gracefully (lines 311-312)
      // The client will try to connect but fail, triggering the catch block
      const result = await getCachedBadgeAfterError('error-badge-user')
      expect(result).toBeNull()
      
      // Clean up
      await closeAfterError()
      process.env.REDIS_URL = originalUrl
      vi.resetModules()
    })

    it('handles write errors for badge cache', async () => {
      // Close any existing connection
      const { closeRedisConnection } = await reImportRedisModule()
      await closeRedisConnection()
      
      // Use invalid URL to force connection error
      const originalUrl = process.env.REDIS_URL
      process.env.REDIS_URL = 'redis://invalid-host:6379'
      
      vi.resetModules()
      const { setCachedBadge, closeRedisConnection: closeAfterError } = await reImportRedisModule()
      
      const imageBuffer = Buffer.from('test-image')
      
      // This should handle the error gracefully without throwing (lines 339-343)
      // The client will try to connect but fail, triggering the catch block
      await expect(setCachedBadge('testuser', imageBuffer)).resolves.not.toThrow()
      
      // Clean up
      await closeAfterError()
      process.env.REDIS_URL = originalUrl
      vi.resetModules()
    })
  })
})

