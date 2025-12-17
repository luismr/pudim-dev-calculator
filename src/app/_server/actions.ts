'use server'

// Re-export types for convenience (maintains backward compatibility)
export type {
  PudimRank,
  GitHubStats,
  PudimScoreResult,
  PudimError,
} from '@/lib/pudim/types'

// Server action: Get GitHub stats and calculate Pudim Score
// This combines data fetching and business logic on the server
import { getGithubStats } from '@/lib/pudim/github'
import { calculatePudimScore } from '@/lib/pudim/score'
import type { PudimScoreResult, PudimError } from '@/lib/pudim/types'
import { savePudimScore, getTop10Scores, type TopScoreEntry } from '@/lib/dynamodb'

export async function getPudimScore(
  username: string
): Promise<PudimScoreResult | PudimError> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  try {
    console.log(`[Pudim Score] Starting calculation for user "${username}" at ${timestamp}`)
    
    const stats = await getGithubStats(username)

    if ('error' in stats) {
      console.error(`[Pudim Score] Failed to get stats for user "${username}":`, {
        error: stats.error,
        username,
        timestamp,
        duration: `${Date.now() - startTime}ms`,
      })
      return stats
    }

    console.log(`[Pudim Score] Successfully fetched stats for user "${username}":`, {
      username: stats.username,
      followers: stats.followers,
      total_stars: stats.total_stars,
      public_repos: stats.public_repos,
      languages_count: stats.languages?.length || 0,
      timestamp,
      duration: `${Date.now() - startTime}ms`,
    })

    const { score, rank } = calculatePudimScore(stats)

    console.log(`[Pudim Score] Calculated score for user "${username}":`, {
      username,
      score: Math.round(score),
      rank: rank.rank,
      rank_title: rank.title,
      timestamp,
      duration: `${Date.now() - startTime}ms`,
    })

    // Save to DynamoDB (fire and forget - don't block the response)
    savePudimScore(username, score, rank, stats).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : typeof error
      const errorCode = 'code' in error ? (error as { code?: string }).code : undefined
      
      console.error(`[Pudim Score] Failed to save score to DynamoDB for user "${username}":`, {
        error: errorMessage,
        error_name: errorName,
        error_code: errorCode,
        stack: error instanceof Error ? error.stack : undefined,
        username,
        score: Math.round(score),
        rank: rank.rank,
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`,
      })
    })

    return {
      stats,
      score,
      rank,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error(`[Pudim Score] Unexpected error calculating score for user "${username}":`, {
      error: errorMessage,
      error_name: errorName,
      error_code: errorCode,
      error_type: error?.constructor?.name || typeof error,
      stack: errorStack,
      username,
      timestamp,
      duration: `${Date.now() - startTime}ms`,
      error_details: error instanceof Error ? {
        message: error.message,
        name: error.name,
        ...(error.cause && typeof error.cause === 'object' ? { cause: error.cause } : {}),
      } : { raw_error: String(error) },
    })
    
    // Provide more specific error messages based on error type
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'Network error. Please check your connection and try again.' }
    }
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return { error: 'Request timed out. Please try again.' }
    }
    
    return { 
      error: `An unexpected error occurred while calculating your score. Please try again. (Error: ${errorName})` 
    }
  }
}

/**
 * Server action: Get top 10 pudim scores
 * Returns the latest score for each user, sorted by score descending
 */
export async function getTopScores(): Promise<TopScoreEntry[] | PudimError> {
  try {
    const topScores = await getTop10Scores()
    return topScores
  } catch (error) {
    console.error('Failed to fetch top scores from DynamoDB:', error)
    return {
      error: 'Failed to fetch top scores',
    }
  }
}

