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

export async function getPudimScore(
  username: string
): Promise<PudimScoreResult | PudimError> {
  const stats = await getGithubStats(username)

  if ('error' in stats) {
    return stats
  }

  const { score, rank } = calculatePudimScore(stats)

  return {
    stats,
    score,
    rank,
  }
}

