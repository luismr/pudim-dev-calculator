import type { GitHubStats, PudimError } from './types'
import { getCachedStats, setCachedStats } from '@/lib/redis'

/**
 * Fetches GitHub user statistics including repos, stars, and languages
 * Uses Redis cache if enabled to reduce GitHub API calls
 */
export async function getGithubStats(
  username: string
): Promise<GitHubStats | PudimError> {
  try {
    // Check cache first if Redis is enabled
    const cachedStats = await getCachedStats(username)
    if (cachedStats) {
      return cachedStats
    }

    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      next: { revalidate: 3600 },
    })

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return { error: 'User not found' }
      }
      return { error: 'Failed to fetch user data' }
    }

    const user = await userResponse.json()

    // Fetch repos to calculate stars and languages (limit to first 100 for performance/rate limits)
    const reposResponse = await fetch(user.repos_url + '?per_page=100')
    const repos = reposResponse.ok ? await reposResponse.json() : []

    const stars = repos.reduce(
      (acc: number, repo: { stargazers_count: number }) =>
        acc + repo.stargazers_count,
      0
    )

    // Calculate Language Usage
    const languageCounts: Record<string, number> = {}
    let totalReposWithLang = 0

    repos.forEach((repo: { language: string | null; size: number }) => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
        totalReposWithLang++
      }
    })

    const languages = Object.entries(languageCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          totalReposWithLang > 0 ? (count / totalReposWithLang) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 languages

    const stats: GitHubStats = {
      username: user.login,
      avatar_url: user.avatar_url,
      followers: user.followers,
      public_repos: user.public_repos,
      total_stars: stars,
      created_at: user.created_at,
      languages,
    }

    // Cache the result if Redis is enabled (fire and forget)
    setCachedStats(username, stats).catch((error) => {
      // Log but don't throw - caching failures shouldn't break the app
      console.error('Failed to cache GitHub stats:', error)
    })

    return stats
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

