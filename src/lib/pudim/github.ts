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
      console.log(`[GitHub Stats] Using cached data for user "${username}"`)
      return cachedStats
    }
    
    console.log(`[GitHub Stats] Fetching from GitHub API for user "${username}"`)

    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      next: { revalidate: 3600 },
    })

    if (!userResponse.ok) {
      const statusText = userResponse.statusText || 'Unknown error'
      const responseBody = await userResponse.text().catch(() => 'Unable to read response body')
      
      console.error(`[GitHub Stats] GitHub API error for user "${username}":`, {
        status: userResponse.status,
        status_text: statusText,
        response_body: responseBody,
        username,
        timestamp: new Date().toISOString(),
        url: `https://api.github.com/users/${username}`,
      })
      
      if (userResponse.status === 404) {
        return { error: 'User not found' }
      }
      
      if (userResponse.status === 403) {
        return { error: 'GitHub API rate limit exceeded. Please try again later.' }
      }
      
      if (userResponse.status >= 500) {
        return { error: 'GitHub API is temporarily unavailable. Please try again later.' }
      }
      
      return { error: `Failed to fetch user data (HTTP ${userResponse.status})` }
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
    console.log(`[GitHub Stats] Saving to cache for user "${username}"`)
    setCachedStats(username, stats).catch((error) => {
      // Log but don't throw - caching failures shouldn't break the app
      console.error(`[GitHub Stats] Failed to cache stats for user "${username}":`, error)
    })

    return stats
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined
    const errorStack = error instanceof Error ? error.stack : undefined
    const timestamp = new Date().toISOString()
    
    console.error(`[GitHub Stats] Failed to fetch stats for user "${username}":`, {
      error: errorMessage,
      error_name: errorName,
      error_code: errorCode,
      error_type: error?.constructor?.name || typeof error,
      stack: errorStack,
      username,
      timestamp,
      error_details: error instanceof Error ? {
        message: error.message,
        name: error.name,
        ...(error.cause && typeof error.cause === 'object' ? { cause: error.cause } : {}),
      } : { raw_error: String(error) },
    })
    
    // Return user-friendly error message based on error type
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'Network error. Please check your connection and try again.' }
    }
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return { error: 'Request timed out. Please try again.' }
    }
    
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'ENOTFOUND') {
      return { error: 'DNS resolution failed. Please check your internet connection.' }
    }
    
    return { error: `Failed to fetch GitHub data. Please try again later. (Error: ${errorName})` }
  }
}

