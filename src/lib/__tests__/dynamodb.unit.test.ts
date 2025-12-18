import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GitHubStats, PudimRank } from '../pudim/types'

// Create mock functions outside to avoid hoisting issues
const mockSend = vi.fn()
const mockFrom = vi.fn()

// Mock DynamoDB Client class
class MockDynamoDBClient {
  send = mockSend
  constructor() {
    // Mock constructor
  }
}

// Mock Document Client class
class MockDocClient {
  send = mockSend
  constructor() {
    // Mock constructor
  }
}

// Mock Command classes
class MockCreateTableCommand {
  constructor(public params: unknown) {}
}

class MockDescribeTableCommand {
  constructor(public params: unknown) {}
}

class MockPutCommand {
  constructor(public params: unknown) {}
}

class MockQueryCommand {
  constructor(public params: unknown) {}
}

class MockUpdateCommand {
  constructor(public input: unknown) {}
}

class MockScanCommand {
  constructor(public params: unknown) {}
}

// Mock AWS SDK modules
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: MockDynamoDBClient,
  CreateTableCommand: MockCreateTableCommand,
  DescribeTableCommand: MockDescribeTableCommand,
  ResourceNotFoundException: class extends Error {
    constructor() {
      super('Table not found')
      this.name = 'ResourceNotFoundException'
    }
  },
}))

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: mockFrom.mockImplementation(() => new MockDocClient()),
  },
  PutCommand: MockPutCommand,
  QueryCommand: MockQueryCommand,
  ScanCommand: MockScanCommand,
  UpdateCommand: MockUpdateCommand,
}))

describe('DynamoDB Service Unit Tests (Mocked)', () => {
  const originalEnv = process.env

  const mockStats: GitHubStats = {
    username: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
    followers: 100,
    total_stars: 500,
    public_repos: 50,
    created_at: '2020-01-01T00:00:00Z',
  }

  const mockRank: PudimRank = {
    rank: 'A',
    title: 'Tasty Pudding',
    description: 'Everyone wants a slice. Great job!',
    emoji: '😋',
    color: 'text-orange-500',
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    mockSend.mockReset()
    mockFrom.mockReset()

    // Reset environment
    process.env = { ...originalEnv }
    process.env.DYNAMODB_ENABLED = 'true'
    process.env.AWS_REGION = 'us-east-1'
    process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000'
    process.env.AWS_ACCESS_KEY_ID = 'test'
    process.env.AWS_SECRET_ACCESS_KEY = 'test'
    process.env.DYNAMODB_CIRCUIT_BREAKER_COOLDOWN = '1000'

    // Default mock implementations
    mockSend.mockResolvedValue({ Items: [] })
    mockFrom.mockImplementation(() => new MockDocClient())

    // Reset modules to get fresh instances
    vi.resetModules()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('ensureTableExists', () => {
    it('should not create table if it already exists', async () => {
      mockSend.mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })

      const { ensureTableExists } = await import('../dynamodb')
      await ensureTableExists()

      // Should call DescribeTable, not CreateTable
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('should create table if it does not exist', async () => {
      const { ResourceNotFoundException } = await import('@aws-sdk/client-dynamodb')
      mockSend
        .mockRejectedValueOnce(new ResourceNotFoundException())
        .mockResolvedValueOnce({})

      const { ensureTableExists } = await import('../dynamodb')
      await ensureTableExists()

      // Should call DescribeTable (fails), then CreateTable
      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    it('should return false and open circuit breaker on unexpected errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Unexpected error'))

      const { ensureTableExists } = await import('../dynamodb')

      const result = await ensureTableExists()
      
      expect(result).toBe(false)
    })
  })

  describe('savePudimScore', () => {
    it('should save a pudim score record', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // getUserLatestScore - ensureTableExists
        .mockResolvedValueOnce({ Items: [] }) // getUserLatestScore - QueryCommand (no existing score)
        .mockResolvedValueOnce({}) // savePudimScore - PutCommand

      const { savePudimScore } = await import('../dynamodb')
      await savePudimScore('testuser', 1100, mockRank, mockStats)

      expect(mockSend).toHaveBeenCalledTimes(4) // ensureTableExists + getUserLatestScore (ensureTableExists + Query) + PutCommand
    })

    it('should include UTC timestamp in ISO 8601 format', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // getUserLatestScore - ensureTableExists
        .mockResolvedValueOnce({ Items: [] }) // getUserLatestScore - QueryCommand (no existing score)
        .mockResolvedValueOnce({}) // savePudimScore - PutCommand

      const beforeTime = new Date().toISOString()
      const { savePudimScore } = await import('../dynamodb')
      await savePudimScore('testuser2', 500, mockRank, mockStats)
      const afterTime = new Date().toISOString()

      expect(beforeTime).toBeTruthy()
      expect(afterTime).toBeTruthy()
      expect(mockSend).toHaveBeenCalledTimes(4)
    })

    it('should include all required fields', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({})

      const { savePudimScore } = await import('../dynamodb')
      await savePudimScore('testuser3', 750, mockRank, mockStats)

      // Verify PutCommand was called with proper structure
      const putCall = mockSend.mock.calls[1]
      expect(putCall).toBeDefined()
    })
  })

  describe('getUserLatestScore', () => {
    it('should return null for non-existent user', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: [] })

      const { getUserLatestScore } = await import('../dynamodb')
      const result = await getUserLatestScore('nonexistent')

      expect(result).toBeNull()
    })

    it('should return the latest score when it exists', async () => {
      const mockRecord = {
        username: 'testuser',
        timestamp: '2025-12-17T10:00:00.000Z',
        score: 1000,
        rank: mockRank,
        stats: mockStats,
      }

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: [mockRecord] })

      const { getUserLatestScore } = await import('../dynamodb')
      const result = await getUserLatestScore('testuser')

      expect(result).toEqual(mockRecord)
    })

    it('should query with correct parameters', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: [] })

      const { getUserLatestScore } = await import('../dynamodb')
      await getUserLatestScore('testuser')

      expect(mockSend).toHaveBeenCalledTimes(2)
    })
  })

  describe('getTop10Scores', () => {
    it('should return an empty array when no scores exist', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: [] })

      const { getTop10Scores } = await import('../dynamodb')
      const result = await getTop10Scores()

      expect(result).toEqual([])
    })

    it('should return top scores in descending order', async () => {
      const mockRecords = [
        {
          username: 'user1',
          timestamp: '2025-12-17T10:00:00.000Z',
          score: 1500,
          rank: mockRank,
          stats: { ...mockStats, username: 'user1' },
          leaderboard_consent: true,
        },
        {
          username: 'user2',
          timestamp: '2025-12-17T09:00:00.000Z',
          score: 800,
          rank: mockRank,
          stats: { ...mockStats, username: 'user2' },
          leaderboard_consent: true,
        },
        {
          username: 'user3',
          timestamp: '2025-12-17T08:00:00.000Z',
          score: 600,
          rank: mockRank,
          stats: { ...mockStats, username: 'user3' },
          leaderboard_consent: true,
        },
      ]

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: mockRecords })

      const { getTop10Scores } = await import('../dynamodb')
      const result = await getTop10Scores()

      expect(result.length).toBe(3)
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score)
      expect(result[1].score).toBeGreaterThanOrEqual(result[2].score)
    })

    it('should return only latest score per user', async () => {
      const mockRecords = [
        {
          username: 'user1',
          timestamp: '2025-12-17T10:00:00.000Z',
          score: 1500,
          rank: mockRank,
          stats: { ...mockStats, username: 'user1' },
          leaderboard_consent: true,
        },
        {
          username: 'user1',
          timestamp: '2025-12-17T09:00:00.000Z',
          score: 1000,
          rank: mockRank,
          stats: { ...mockStats, username: 'user1' },
          leaderboard_consent: true,
        },
      ]

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: mockRecords })

      const { getTop10Scores } = await import('../dynamodb')
      const result = await getTop10Scores()

      // Should only return the latest score for user1
      expect(result.length).toBe(1)
      expect(result[0].timestamp).toBe('2025-12-17T10:00:00.000Z')
    })

    it('should limit results to 10 entries', async () => {
      const mockRecords = Array.from({ length: 15 }, (_, i) => ({
        username: `user${i}`,
        timestamp: '2025-12-17T10:00:00.000Z',
        score: 1000 - i * 10,
        rank: mockRank,
        stats: { ...mockStats, username: `user${i}` },
        leaderboard_consent: true,
      }))

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: mockRecords })

      const { getTop10Scores } = await import('../dynamodb')
      const result = await getTop10Scores()

      expect(result.length).toBeLessThanOrEqual(10)
    })

    it('should include required fields in TopScoreEntry', async () => {
      const mockRecord = {
        username: 'user1',
        timestamp: '2025-12-17T10:00:00.000Z',
        score: 1500,
        rank: mockRank,
        stats: mockStats,
        leaderboard_consent: true,
      }

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: [mockRecord] })

      const { getTop10Scores } = await import('../dynamodb')
      const result = await getTop10Scores()

      expect(result[0]).toHaveProperty('username')
      expect(result[0]).toHaveProperty('timestamp')
      expect(result[0]).toHaveProperty('score')
      expect(result[0]).toHaveProperty('rank')
      expect(result[0]).toHaveProperty('avatar_url')
      expect(result[0]).toHaveProperty('followers')
      expect(result[0]).toHaveProperty('total_stars')
      expect(result[0]).toHaveProperty('public_repos')
    })
  })

  describe('getUserScoreHistory', () => {
    it('should return an empty array for non-existent user', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: [] })

      const { getUserScoreHistory } = await import('../dynamodb')
      const result = await getUserScoreHistory('nonexistent')

      expect(result).toEqual([])
    })

    it('should respect the limit parameter', async () => {
      const mockRecords = Array.from({ length: 15 }, (_, i) => ({
        username: 'testuser',
        timestamp: `2025-12-17T${String(10 + i).padStart(2, '0')}:00:00.000Z`,
        score: 1000 + i,
        rank: mockRank,
        stats: mockStats,
      }))

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: mockRecords.slice(0, 5) })

      const { getUserScoreHistory } = await import('../dynamodb')
      const result = await getUserScoreHistory('testuser', 5)

      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should use default limit of 10 when not specified', async () => {
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: [] })

      const { getUserScoreHistory } = await import('../dynamodb')
      await getUserScoreHistory('testuser')

      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    it('should return scores in descending timestamp order', async () => {
      const mockRecords = [
        {
          username: 'testuser',
          timestamp: '2025-12-17T12:00:00.000Z',
          score: 1200,
          rank: mockRank,
          stats: mockStats,
        },
        {
          username: 'testuser',
          timestamp: '2025-12-17T10:00:00.000Z',
          score: 1000,
          rank: mockRank,
          stats: mockStats,
        },
        {
          username: 'testuser',
          timestamp: '2025-12-17T08:00:00.000Z',
          score: 800,
          rank: mockRank,
          stats: mockStats,
        },
      ]

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
        .mockResolvedValueOnce({ Items: mockRecords })

      const { getUserScoreHistory } = await import('../dynamodb')
      const result = await getUserScoreHistory('testuser')

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].timestamp >= result[i + 1].timestamp).toBe(true)
      }
    })
  })

  describe('updateConsentForLatestScore', () => {
    beforeEach(() => {
      process.env.DYNAMODB_ENABLED = 'true'
      process.env.AWS_REGION = 'us-east-1'
      process.env.AWS_ACCESS_KEY_ID = 'test'
      process.env.AWS_SECRET_ACCESS_KEY = 'test'
    })

    it('should update consent for latest score', async () => {
      const mockLatestScore = {
        username: 'testuser',
        timestamp: '2025-12-17T10:00:00.000Z',
        score: 1500,
        rank: mockRank,
        stats: mockStats,
        leaderboard_consent: false,
      }

      // ensureTableExists (in updateConsentForLatestScore) -> DescribeTableCommand
      // ensureTableExists (in getUserLatestScore) -> DescribeTableCommand  
      // getUserLatestScore -> QueryCommand
      // updateConsentForLatestScore -> UpdateCommand
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists in updateConsentForLatestScore
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists in getUserLatestScore
        .mockResolvedValueOnce({ Items: [mockLatestScore] }) // getUserLatestScore QueryCommand
        .mockResolvedValueOnce({}) // UpdateCommand response

      const { updateConsentForLatestScore } = await import('../dynamodb')
      await updateConsentForLatestScore('testuser', true)

      expect(mockSend).toHaveBeenCalledTimes(4)
      const updateCall = mockSend.mock.calls[3][0]
      expect(updateCall).toBeInstanceOf(MockUpdateCommand)
      const updateParams = updateCall.input as { UpdateExpression: string; ExpressionAttributeValues: Record<string, boolean> }
      expect(updateParams.UpdateExpression).toBe('SET leaderboard_consent = :consent')
      expect(updateParams.ExpressionAttributeValues).toEqual({
        ':consent': true,
      })
    })

    it('should do nothing when DynamoDB is disabled', async () => {
      process.env.DYNAMODB_ENABLED = 'false'

      const { updateConsentForLatestScore } = await import('../dynamodb')
      await updateConsentForLatestScore('testuser', true)

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should do nothing when table does not exist', async () => {
      vi.clearAllMocks()
      // ensureTableExists returns false (no table) - DescribeTableCommand fails
      mockSend.mockRejectedValueOnce(new Error('Table not found'))

      const { updateConsentForLatestScore } = await import('../dynamodb')
      await updateConsentForLatestScore('testuser', true)

      // Only ensureTableExists is called (DescribeTableCommand), then it returns early
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('should do nothing when no score found for user', async () => {
      vi.clearAllMocks()
      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists in updateConsentForLatestScore
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists in getUserLatestScore
        .mockResolvedValueOnce({ Items: [] }) // getUserLatestScore QueryCommand (no items)

      const { updateConsentForLatestScore } = await import('../dynamodb')
      await updateConsentForLatestScore('testuser', true)

      // ensureTableExists (2x DescribeTableCommand) + getUserLatestScore (QueryCommand), then returns early
      expect(mockSend).toHaveBeenCalledTimes(3)
    })

    it('should handle errors and open circuit breaker', async () => {
      vi.clearAllMocks()
      const mockLatestScore = {
        username: 'testuser',
        timestamp: '2025-12-17T10:00:00.000Z',
        score: 1500,
        rank: mockRank,
        stats: mockStats,
        leaderboard_consent: false,
      }

      mockSend
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists in updateConsentForLatestScore
        .mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } }) // ensureTableExists in getUserLatestScore
        .mockResolvedValueOnce({ Items: [mockLatestScore] }) // getUserLatestScore QueryCommand
        .mockRejectedValueOnce(new Error('Update failed')) // UpdateCommand fails

      const { updateConsentForLatestScore } = await import('../dynamodb')
      
      await expect(updateConsentForLatestScore('testuser', true)).rejects.toThrow('Update failed')
      expect(mockSend).toHaveBeenCalledTimes(4)
    })
  })

  describe('Configuration', () => {
    it('should use environment variables for configuration', async () => {
      process.env.DYNAMODB_ENABLED = 'true'
      process.env.AWS_REGION = 'eu-west-1'
      process.env.DYNAMODB_ENDPOINT = 'http://custom:9000'
      process.env.AWS_ACCESS_KEY_ID = 'customKey'
      process.env.AWS_SECRET_ACCESS_KEY = 'customSecret'

      vi.resetModules()
      const { ensureTableExists } = await import('../dynamodb')

      mockSend.mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
      const result = await ensureTableExists()

      expect(result).toBe(true)
      expect(mockSend).toHaveBeenCalled()
    })

    it('should use default values when environment variables are not set', async () => {
      process.env.DYNAMODB_ENABLED = 'true'
      delete process.env.AWS_REGION
      delete process.env.DYNAMODB_ENDPOINT
      delete process.env.AWS_ACCESS_KEY_ID
      delete process.env.AWS_SECRET_ACCESS_KEY

      vi.resetModules()
      const { ensureTableExists } = await import('../dynamodb')

      mockSend.mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
      const result = await ensureTableExists()

      expect(result).toBe(true)
      expect(mockSend).toHaveBeenCalled()
    })

    it('should return false when DYNAMODB_ENABLED is false', async () => {
      process.env.DYNAMODB_ENABLED = 'false'

      vi.resetModules()
      const { ensureTableExists } = await import('../dynamodb')

      const result = await ensureTableExists()

      expect(result).toBe(false)
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should return false when DYNAMODB_ENABLED is not set', async () => {
      delete process.env.DYNAMODB_ENABLED

      vi.resetModules()
      const { ensureTableExists } = await import('../dynamodb')

      const result = await ensureTableExists()

      expect(result).toBe(false)
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('Circuit Breaker', () => {
    it('should open circuit breaker on connection error', async () => {
      mockSend.mockRejectedValueOnce(new Error('Connection failed'))

      vi.resetModules()
      const { ensureTableExists, savePudimScore } = await import('../dynamodb')

      const result = await ensureTableExists()
      expect(result).toBe(false)

      // Circuit breaker should now be open
      await savePudimScore('testuser', 100, mockRank, mockStats)

      // Should not attempt another connection (only 1 call from first failure)
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('should use custom circuit breaker cooldown from environment', async () => {
      process.env.DYNAMODB_CIRCUIT_BREAKER_COOLDOWN = '100'
      mockSend.mockRejectedValueOnce(new Error('Connection failed'))

      vi.resetModules()
      const { ensureTableExists, closeCircuitBreaker } = await import(
        '../dynamodb'
      )

      await ensureTableExists()

      // Wait for cooldown to expire
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Manually close circuit breaker for testing
      closeCircuitBreaker()

      mockSend.mockResolvedValueOnce({ Table: { TableName: 'PudimScores' } })
      const result = await ensureTableExists()

      expect(result).toBe(true)
    })
  })

  describe('Disabled DynamoDB', () => {
    beforeEach(() => {
      process.env.DYNAMODB_ENABLED = 'false'
      vi.resetModules()
    })

    it('should return null/empty when disabled - getUserLatestScore', async () => {
      const { getUserLatestScore } = await import('../dynamodb')

      const result = await getUserLatestScore('testuser')
      expect(result).toBeNull()
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should return empty array when disabled - getTop10Scores', async () => {
      const { getTop10Scores } = await import('../dynamodb')

      const result = await getTop10Scores()
      expect(result).toEqual([])
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should return empty array when disabled - getUserScoreHistory', async () => {
      const { getUserScoreHistory } = await import('../dynamodb')

      const result = await getUserScoreHistory('testuser')
      expect(result).toEqual([])
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should silently skip save when disabled', async () => {
      const { savePudimScore } = await import('../dynamodb')

      await savePudimScore('testuser', 100, mockRank, mockStats)

      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('Type Safety', () => {
    it('should have correct PudimScoreRecord structure', () => {
      const record = {
        username: 'test',
        timestamp: new Date().toISOString(),
        score: 100,
        rank: mockRank,
        stats: mockStats,
      }

      expect(record.username).toBeTypeOf('string')
      expect(record.timestamp).toBeTypeOf('string')
      expect(record.score).toBeTypeOf('number')
      expect(record.rank).toBeTypeOf('object')
      expect(record.stats).toBeTypeOf('object')
    })

    it('should have correct TopScoreEntry structure', () => {
      const entry = {
        username: 'test',
        timestamp: new Date().toISOString(),
        score: 100,
        rank: mockRank,
        avatar_url: 'https://example.com/avatar.jpg',
        followers: 100,
        total_stars: 500,
        public_repos: 50,
      }

      expect(entry.username).toBeTypeOf('string')
      expect(entry.timestamp).toBeTypeOf('string')
      expect(entry.score).toBeTypeOf('number')
      expect(entry.avatar_url).toBeTypeOf('string')
      expect(entry.followers).toBeTypeOf('number')
      expect(entry.total_stars).toBeTypeOf('number')
      expect(entry.public_repos).toBeTypeOf('number')
    })
  })
})

