import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPudimScore } from '../actions'
import { getGithubStats } from '@/lib/pudim/github'
import { calculatePudimScore } from '@/lib/pudim/score'

// Mock the dependencies
vi.mock('@/lib/pudim/github')
vi.mock('@/lib/pudim/score')

describe('getPudimScore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when getGithubStats returns error', async () => {
    vi.mocked(getGithubStats).mockResolvedValue({ error: 'User not found' })

    const result = await getPudimScore('nonexistentuser')

    expect(result).toEqual({ error: 'User not found' })
    expect(calculatePudimScore).not.toHaveBeenCalled()
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

    const result = await getPudimScore('testuser')

    expect(result).toEqual({
      stats: mockStats,
      score: 500,
      rank: mockScoreResult.rank,
    })
    expect(calculatePudimScore).toHaveBeenCalledWith(mockStats)
  })
})
