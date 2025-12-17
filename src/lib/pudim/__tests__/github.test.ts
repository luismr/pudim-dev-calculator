import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getGithubStats } from '../github'

// Mock global fetch
global.fetch = vi.fn()

// Mock Redis cache
vi.mock('@/lib/redis', () => ({
  getCachedStats: vi.fn(),
  setCachedStats: vi.fn(),
}))

describe('getGithubStats', () => {
  let getCachedStats: ReturnType<typeof vi.fn>
  let setCachedStats: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const redisModule = await import('@/lib/redis')
    getCachedStats = vi.mocked(redisModule.getCachedStats)
    setCachedStats = vi.mocked(redisModule.setCachedStats)
    
    // Default: no cache hit
    getCachedStats.mockResolvedValue(null)
    // Default: cache set succeeds
    setCachedStats.mockResolvedValue(undefined)
  })

  it('fetches user data successfully', async () => {
    const mockUserData = {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      followers: 100,
      public_repos: 50,
      repos_url: 'https://api.github.com/users/testuser/repos',
    }

    const mockReposData = [
      {
        stargazers_count: 10,
        language: 'JavaScript',
        size: 100,
      },
      {
        stargazers_count: 5,
        language: 'TypeScript',
        size: 200,
      },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReposData,
      } as Response)

    const result = await getGithubStats('testuser')

    expect(result).toMatchObject({
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      followers: 100,
      public_repos: 50,
      total_stars: 15,
    })
    expect(result.languages).toBeDefined()
  })

  it('returns error when user is not found', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => '{"message":"Not Found"}',
    } as Response)

    const result = await getGithubStats('nonexistentuser')

    expect(result).toEqual({
      error: 'User not found',
    })
  })

  it('returns error when user fetch fails with non-404 status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '{"message":"Internal Server Error"}',
    } as Response)

    const result = await getGithubStats('testuser')

    expect(result).toEqual({
      error: 'GitHub API is temporarily unavailable. Please try again later.',
    })
  })

  it('returns error when API fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed'))

    const result = await getGithubStats('testuser')

    expect(result).toEqual({
      error: 'Network error. Please check your connection and try again.',
    })
  })

  it('calculates language percentages correctly', async () => {
    const mockUserData = {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      followers: 100,
      public_repos: 4,
      repos_url: 'https://api.github.com/users/testuser/repos',
    }

    const mockReposData = [
      { stargazers_count: 10, language: 'JavaScript', size: 400 },
      { stargazers_count: 5, language: 'JavaScript', size: 300 },
      { stargazers_count: 3, language: 'TypeScript', size: 200 },
      { stargazers_count: 2, language: 'Python', size: 100 },
      { stargazers_count: 1, language: null, size: 50 },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReposData,
      } as Response)

    const result = await getGithubStats('testuser')

    expect(result.languages).toBeDefined()
    if (result.languages) {
      // Languages are counted by repo count, not size
      // 2 JavaScript repos = 50%, 1 TypeScript = 25%, 1 Python = 25%
      expect(result.languages.find(l => l.name === 'JavaScript')?.percentage).toBeCloseTo(50, 0)
      expect(result.languages.find(l => l.name === 'TypeScript')?.percentage).toBeCloseTo(25, 0)
      expect(result.languages.find(l => l.name === 'Python')?.percentage).toBeCloseTo(25, 0)
    }
  })

  it('filters out repos without language', async () => {
    const mockUserData = {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      followers: 100,
      public_repos: 2,
      repos_url: 'https://api.github.com/users/testuser/repos',
    }

    const mockReposData = [
      { stargazers_count: 10, language: 'JavaScript', size: 100 },
      { stargazers_count: 5, language: null, size: 50 },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReposData,
      } as Response)

    const result = await getGithubStats('testuser')

    expect(result.languages).toBeDefined()
    if (result.languages) {
      expect(result.languages).toHaveLength(1)
      expect(result.languages[0].name).toBe('JavaScript')
    }
  })

  it('calculates total stars correctly', async () => {
    const mockUserData = {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      followers: 100,
      public_repos: 3,
      repos_url: 'https://api.github.com/users/testuser/repos',
    }

    const mockReposData = [
      { stargazers_count: 100, language: 'JavaScript', size: 100 },
      { stargazers_count: 50, language: 'TypeScript', size: 100 },
      { stargazers_count: 25, language: 'Python', size: 100 },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReposData,
      } as Response)

    const result = await getGithubStats('testuser')

    expect(result.total_stars).toBe(175)
  })

  it('handles repos response failure gracefully', async () => {
    const mockUserData = {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      followers: 100,
      public_repos: 50,
      repos_url: 'https://api.github.com/users/testuser/repos',
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => [],
      } as Response)

    const result = await getGithubStats('testuser')

    expect(result).toMatchObject({
      username: 'testuser',
      total_stars: 0,
    })
    expect(result.languages).toEqual([])
  })

  it('returns cached stats when available', async () => {
    const cachedStats = {
      username: 'cacheduser',
      avatar_url: 'https://example.com/cached.jpg',
      followers: 200,
      total_stars: 100,
      public_repos: 20,
      created_at: '2010-01-01T00:00:00Z',
      languages: [{ name: 'JavaScript', count: 10, percentage: 100 }],
    }

    vi.mocked(getCachedStats).mockResolvedValueOnce(cachedStats)

    const result = await getGithubStats('cacheduser')

    expect(result).toEqual(cachedStats)
    expect(fetch).not.toHaveBeenCalled()
    expect(setCachedStats).not.toHaveBeenCalled()
  })

  it('caches stats after fetching from GitHub', async () => {
    const mockUserData = {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      followers: 100,
      public_repos: 50,
      repos_url: 'https://api.github.com/users/testuser/repos',
    }

    const mockReposData = [
      {
        stargazers_count: 10,
        language: 'JavaScript',
        size: 100,
      },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReposData,
      } as Response)

    const result = await getGithubStats('testuser')

    expect(result).toMatchObject({
      username: 'testuser',
    })
    expect(setCachedStats).toHaveBeenCalledWith('testuser', expect.objectContaining({
      username: 'testuser',
      followers: 100,
      total_stars: 10,
    }))
  })

  it('handles cache write failures gracefully', async () => {
    const mockUserData = {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      followers: 100,
      public_repos: 50,
      repos_url: 'https://api.github.com/users/testuser/repos',
    }

    const mockReposData = [
      {
        stargazers_count: 10,
        language: 'JavaScript',
        size: 100,
      },
    ]

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(setCachedStats).mockRejectedValueOnce(new Error('Cache write failed'))

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReposData,
      } as Response)

    const result = await getGithubStats('testuser')

    // Should still return the stats even if caching fails
    expect(result).toMatchObject({
      username: 'testuser',
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith('[GitHub Stats] Failed to cache stats for user "testuser":', expect.any(Error))
    
    consoleErrorSpy.mockRestore()
  })
})

