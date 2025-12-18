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
import { savePudimScore, getTop10Scores, updateConsentForLatestScore, type TopScoreEntry } from '@/lib/dynamodb'

export async function getPudimScore(
  username: string
): Promise<PudimScoreResult | PudimError> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  try {
    console.log(JSON.stringify({ level: 'info', message: '[Pudim Score] Starting calculation', username, timestamp }))
    
    const stats = await getGithubStats(username)

    if ('error' in stats) {
      console.error(JSON.stringify({ level: 'error', message: '[Pudim Score] Failed to get stats', error: stats.error, username, timestamp, duration: `${Date.now() - startTime}ms` }))
      return stats
    }

    console.log(JSON.stringify({ level: 'info', message: '[Pudim Score] Successfully fetched stats', username: stats.username, followers: stats.followers, total_stars: stats.total_stars, public_repos: stats.public_repos, languages_count: stats.languages?.length || 0, timestamp, duration: `${Date.now() - startTime}ms` }))

    const { score, rank } = calculatePudimScore(stats)

    console.log(JSON.stringify({ level: 'info', message: '[Pudim Score] Calculated score', username, score: Math.round(score), rank: rank.rank, rank_title: rank.title, timestamp, duration: `${Date.now() - startTime}ms` }))

    // Save to DynamoDB automatically (without consent) - fire and forget
    savePudimScore(username, score, rank, stats, false).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : typeof error
      console.error(JSON.stringify({ level: 'error', message: '[Pudim Score] Failed to save score to DynamoDB', error: errorMessage, error_name: errorName, username, score: Math.round(score), rank: rank.rank, timestamp: new Date().toISOString(), duration: `${Date.now() - startTime}ms` }))
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
    
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      ...(error.cause && typeof error.cause === 'object' ? { cause: error.cause } : {}),
    } : { raw_error: String(error) }
    
    console.error(JSON.stringify({ level: 'error', message: '[Pudim Score] Unexpected error calculating score', error: errorMessage, error_name: errorName, error_code: errorCode, error_type: error?.constructor?.name || typeof error, stack: errorStack, username, timestamp, duration: `${Date.now() - startTime}ms`, error_details: errorDetails }))
    
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
 * Server action: Update leaderboard consent for user's latest score
 * Updates the latest score record to set leaderboard_consent to true
 * Returns the user's ranking position if successful
 */
export async function updateLeaderboardConsent(
  username: string,
  consent: boolean
): Promise<{ success: boolean; position?: number }> {
  const startTime = Date.now()
  
  try {
    await updateConsentForLatestScore(username, consent)
    console.log(JSON.stringify({ level: 'info', message: '[Pudim Score] Consent updated', username, leaderboard_consent: consent, duration: `${Date.now() - startTime}ms` }))
    
    // Get user's ranking position if consent is true
    let position: number | undefined
    if (consent) {
      const topScores = await getTop10Scores()
      const userIndex = topScores.findIndex(entry => entry.username === username)
      if (userIndex !== -1) {
        position = userIndex + 1
      }
    }
    
    return { success: true, position }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined
    
    console.error(JSON.stringify({ level: 'error', message: '[Pudim Score] Failed to update consent', error: errorMessage, error_name: errorName, error_code: errorCode, stack: error instanceof Error ? error.stack : undefined, username, leaderboard_consent: consent, timestamp: new Date().toISOString(), duration: `${Date.now() - startTime}ms` }))
    throw error
  }
}

/**
 * Server action: Check if user's score would qualify for top 10
 * Returns true if leaderboard/DynamoDB is enabled and user's score would be in top 10
 */
export async function wouldQualifyForTop10(score: number): Promise<boolean> {
  // Check if leaderboard is enabled
  const leaderboardEnabled = process.env.LEADERBOARD_ENABLED === 'true'
  const dynamodbEnabled = process.env.DYNAMODB_ENABLED === 'true'
  
  if (!leaderboardEnabled || !dynamodbEnabled) {
    return false
  }

  try {
    const topScores = await getTop10Scores()
    
    // If there are less than 10 scores, user qualifies
    if (topScores.length < 10) {
      return true
    }
    
    // Check if user's score is higher than the 10th place score
    const tenthPlaceScore = topScores[9]?.score || 0
    return score > tenthPlaceScore
  } catch {
    // If we can't check, don't show the consent option
    return false
  }
}

/**
 * Server action: Get top 10 pudim scores
 * Returns the latest score for each user, sorted by score descending
 * Only works if both DYNAMODB_ENABLED and LEADERBOARD_ENABLED are true
 * Only includes users who have given consent
 */
export async function getTopScores(): Promise<TopScoreEntry[] | PudimError> {
  // Check if leaderboard is enabled
  const leaderboardEnabled = process.env.LEADERBOARD_ENABLED === 'true'
  const dynamodbEnabled = process.env.DYNAMODB_ENABLED === 'true'
  
  if (!leaderboardEnabled || !dynamodbEnabled) {
    return {
      error: 'Leaderboard is not enabled',
    }
  }

  try {
    const topScores = await getTop10Scores()
    return topScores
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 'error', message: 'Failed to fetch top scores from DynamoDB', error: errorMessage, error_name: errorName }))
    return {
      error: 'Failed to fetch top scores',
    }
  }
}

