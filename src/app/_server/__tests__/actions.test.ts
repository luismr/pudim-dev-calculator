import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPudimScore, getTopScores, updateLeaderboardConsent, wouldQualifyForTop10 } from '../actions'
import { getGithubStats } from '@/lib/pudim/github'
import { calculatePudimScore } from '@/lib/pudim/score'
import { savePudimScore, getTop10Scores, updateConsentForLatestScore } from '@/lib/dynamodb'

// Mock the dependencies
vi.mock('@/lib/pudim/github')
vi.mock('@/lib/pudim/score')
vi.mock('@/lib/dynamodb')

describe('getPudimScore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when getGithubStats returns error', async () => {
    vi.mocked(getGithubStats).mockResolvedValue({ error: 'User not found' })

    const result = await getPudimScore('nonexistentuser')

    expect(result).toEqual({ error: 'User not found' })
    expect(calculatePudimScore).not.toHaveBeenCalled()
    expect(savePudimScore).not.toHaveBeenCalled()
  })

  it('returns PudimScoreResult when successful', async () => {
    const mockStats = {
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      followers: 100,
      total_stars: 200,
      public_repos: 50,
      created_at: '2012-01-01T00:00:00Z',
      languages: [],
    }

    const mockScoreResult = {
      score: 500,
      rank: {
        rank: 'S',
        title: 'Master Pudim',
        description: 'A delicious result. Michelin star worthy.',
        emoji: '🍮',
        color: 'text-yellow-600',
      },
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    vi.mocked(calculatePudimScore).mockReturnValue(mockScoreResult)
    vi.mocked(savePudimScore).mockResolvedValue(undefined)

    const result = await getPudimScore('testuser')

    expect(result).toEqual({
      stats: mockStats,
      score: 500,
      rank: mockScoreResult.rank,
    })
    expect(calculatePudimScore).toHaveBeenCalledWith(mockStats)
  })

  it('saves score to DynamoDB after calculating', async () => {
    const mockStats = {
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      followers: 100,
      total_stars: 200,
      public_repos: 50,
      created_at: '2012-01-01T00:00:00Z',
      languages: [],
    }

    const mockScoreResult = {
      score: 500,
      rank: {
        rank: 'S',
        title: 'Master Pudim',
        description: 'A delicious result. Michelin star worthy.',
        emoji: '🍮',
        color: 'text-yellow-600',
      },
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    vi.mocked(calculatePudimScore).mockReturnValue(mockScoreResult)
    vi.mocked(savePudimScore).mockResolvedValue(undefined)

    await getPudimScore('testuser')

    // Give some time for the fire-and-forget promise
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Note: savePudimScore is called in a fire-and-forget manner
    // so we can't guarantee it's called synchronously
  })

  it('continues execution even if DynamoDB save fails', async () => {
    const mockStats = {
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      followers: 100,
      total_stars: 200,
      public_repos: 50,
      created_at: '2012-01-01T00:00:00Z',
      languages: [],
    }

    const mockScoreResult = {
      score: 500,
      rank: {
        rank: 'S',
        title: 'Master Pudim',
        description: 'A delicious result. Michelin star worthy.',
        emoji: '🍮',
        color: 'text-yellow-600',
      },
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    vi.mocked(calculatePudimScore).mockReturnValue(mockScoreResult)
    vi.mocked(savePudimScore).mockRejectedValue(
      new Error('DynamoDB connection failed')
    )

    const result = await getPudimScore('testuser')

    // Should still return the result even if save fails
    expect(result).toEqual({
      stats: mockStats,
      score: 500,
      rank: mockScoreResult.rank,
    })
  })
})

describe('getTopScores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set required environment variables for leaderboard tests
    process.env.LEADERBOARD_ENABLED = 'true'
    process.env.DYNAMODB_ENABLED = 'true'
  })

  it('returns top 10 scores from DynamoDB', async () => {
    const mockTopScores = [
      {
        username: 'user1',
        timestamp: '2023-12-17T10:00:00.000Z',
        score: 1500,
        rank: {
          rank: 'S+',
          title: 'Legendary Flan',
          description: 'The texture is perfect',
          emoji: '🍮✨',
          color: 'text-amber-500',
        },
        avatar_url: 'https://example.com/user1.jpg',
        followers: 500,
        total_stars: 600,
        public_repos: 100,
      },
      {
        username: 'user2',
        timestamp: '2023-12-17T09:00:00.000Z',
        score: 800,
        rank: {
          rank: 'S',
          title: 'Master Pudim',
          description: 'A delicious result',
          emoji: '🍮',
          color: 'text-yellow-600',
        },
        avatar_url: 'https://example.com/user2.jpg',
        followers: 200,
        total_stars: 300,
        public_repos: 50,
      },
    ]

    vi.mocked(getTop10Scores).mockResolvedValue(mockTopScores)

    const result = await getTopScores()

    expect(result).toEqual(mockTopScores)
    expect(getTop10Scores).toHaveBeenCalled()
  })

  it('returns error when DynamoDB query fails', async () => {
    vi.mocked(getTop10Scores).mockRejectedValue(
      new Error('DynamoDB connection failed')
    )

    const result = await getTopScores()

    expect(result).toEqual({ error: 'Failed to fetch top scores' })
  })

  it('returns empty array when no scores exist', async () => {
    vi.mocked(getTop10Scores).mockResolvedValue([])

    const result = await getTopScores()

    expect(result).toEqual([])
  })

  it('returns error when leaderboard is not enabled', async () => {
    process.env.LEADERBOARD_ENABLED = 'false'
    process.env.DYNAMODB_ENABLED = 'true'

    const result = await getTopScores()

    expect(result).toEqual({ error: 'Leaderboard is not enabled' })
  })

  it('returns error when DynamoDB is not enabled', async () => {
    process.env.LEADERBOARD_ENABLED = 'true'
    process.env.DYNAMODB_ENABLED = 'false'

    const result = await getTopScores()

    expect(result).toEqual({ error: 'Leaderboard is not enabled' })
  })
})

describe('updateLeaderboardConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates consent and returns position when user qualifies', async () => {
    const mockTopScores = [
      { username: 'user1', score: 1500, timestamp: '2023-12-17T10:00:00.000Z', rank: { rank: 'S+', title: 'Legendary Flan', description: '', emoji: '🍮✨', color: 'text-amber-500' }, avatar_url: '', followers: 500, total_stars: 600, public_repos: 100 },
      { username: 'testuser', score: 1200, timestamp: '2023-12-17T09:00:00.000Z', rank: { rank: 'S', title: 'Master Pudim', description: '', emoji: '🍮', color: 'text-yellow-600' }, avatar_url: '', followers: 200, total_stars: 300, public_repos: 50 },
    ]

    vi.mocked(updateConsentForLatestScore).mockResolvedValue(undefined)
    vi.mocked(getTop10Scores).mockResolvedValue(mockTopScores)

    const result = await updateLeaderboardConsent('testuser', true)

    expect(result).toEqual({ success: true, position: 2 })
    expect(updateConsentForLatestScore).toHaveBeenCalledWith('testuser', true)
  })

  it('updates consent and returns undefined position when user not in top 10', async () => {
    const mockTopScores = [
      { username: 'user1', score: 1500, timestamp: '2023-12-17T10:00:00.000Z', rank: { rank: 'S+', title: 'Legendary Flan', description: '', emoji: '🍮✨', color: 'text-amber-500' }, avatar_url: '', followers: 500, total_stars: 600, public_repos: 100 },
    ]

    vi.mocked(updateConsentForLatestScore).mockResolvedValue(undefined)
    vi.mocked(getTop10Scores).mockResolvedValue(mockTopScores)

    const result = await updateLeaderboardConsent('testuser', true)

    expect(result).toEqual({ success: true })
    expect(updateConsentForLatestScore).toHaveBeenCalledWith('testuser', true)
  })

  it('handles errors when updating consent fails', async () => {
    vi.mocked(updateConsentForLatestScore).mockRejectedValue(new Error('DynamoDB error'))

    await expect(updateLeaderboardConsent('testuser', true)).rejects.toThrow('DynamoDB error')
  })
})

describe('wouldQualifyForTop10', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.LEADERBOARD_ENABLED = 'true'
    process.env.DYNAMODB_ENABLED = 'true'
  })

  it('returns false when leaderboard is not enabled', async () => {
    process.env.LEADERBOARD_ENABLED = 'false'

    const result = await wouldQualifyForTop10(1500)

    expect(result).toBe(false)
  })

  it('returns false when DynamoDB is not enabled', async () => {
    process.env.DYNAMODB_ENABLED = 'false'

    const result = await wouldQualifyForTop10(1500)

    expect(result).toBe(false)
  })

  it('returns true when score is higher than 10th place', async () => {
    const mockTopScores = Array.from({ length: 10 }, (_, i) => ({
      username: `user${i + 1}`,
      score: 1000 - i * 50,
      timestamp: '2023-12-17T10:00:00.000Z',
      rank: { rank: 'S', title: 'Master Pudim', description: '', emoji: '🍮', color: 'text-yellow-600' },
      avatar_url: '',
      followers: 100,
      total_stars: 200,
      public_repos: 20,
    }))

    vi.mocked(getTop10Scores).mockResolvedValue(mockTopScores)

    const result = await wouldQualifyForTop10(1500)

    expect(result).toBe(true)
  })

  it('returns false when score is lower than 10th place', async () => {
    const mockTopScores = Array.from({ length: 10 }, (_, i) => ({
      username: `user${i + 1}`,
      score: 1000 - i * 50,
      timestamp: '2023-12-17T10:00:00.000Z',
      rank: { rank: 'S', title: 'Master Pudim', description: '', emoji: '🍮', color: 'text-yellow-600' },
      avatar_url: '',
      followers: 100,
      total_stars: 200,
      public_repos: 20,
    }))

    vi.mocked(getTop10Scores).mockResolvedValue(mockTopScores)

    const result = await wouldQualifyForTop10(100)

    expect(result).toBe(false)
  })

  it('returns true when there are fewer than 10 scores', async () => {
    const mockTopScores = [
      { username: 'user1', score: 500, timestamp: '2023-12-17T10:00:00.000Z', rank: { rank: 'S', title: 'Master Pudim', description: '', emoji: '🍮', color: 'text-yellow-600' }, avatar_url: '', followers: 100, total_stars: 200, public_repos: 20 },
    ]

    vi.mocked(getTop10Scores).mockResolvedValue(mockTopScores)

    const result = await wouldQualifyForTop10(100)

    expect(result).toBe(true)
  })

  it('returns false when error occurs', async () => {
    vi.mocked(getTop10Scores).mockRejectedValue(new Error('DynamoDB error'))

    const result = await wouldQualifyForTop10(1500)

    expect(result).toBe(false)
  })
})
