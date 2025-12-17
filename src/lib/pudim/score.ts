import type { GitHubStats, PudimRank } from './types'

/**
 * Business rule: Calculate Pudim Score based on GitHub stats
 * Formula: score = (followers × 0.5) + (total_stars × 2) + (public_repos × 1)
 */
export function calculatePudimScore(
  stats: GitHubStats
): { score: number; rank: PudimRank } {
  const score =
    stats.followers * 0.5 + stats.total_stars * 2 + stats.public_repos * 1

  let rank: PudimRank

  if (score > 1000) {
    rank = {
      rank: 'S+',
      title: 'Legendary Flan',
      description:
        'The texture is perfect, the caramel is divine. You are a coding god!',
      emoji: '🍮✨',
      color: 'text-amber-500',
    }
  } else if (score > 500) {
    rank = {
      rank: 'S',
      title: 'Master Pudim',
      description: 'A delicious result. Michelin star worthy.',
      emoji: '🍮',
      color: 'text-yellow-600',
    }
  } else if (score > 200) {
    rank = {
      rank: 'A',
      title: 'Tasty Pudding',
      description: 'Everyone wants a slice. Great job!',
      emoji: '😋',
      color: 'text-orange-500',
    }
  } else if (score > 100) {
    rank = {
      rank: 'B',
      title: 'Sweet Treat',
      description: 'Solid and dependable. A good dessert.',
      emoji: '🍬',
      color: 'text-orange-400',
    }
  } else if (score > 50) {
    rank = {
      rank: 'C',
      title: 'Homemade',
      description: 'Made with love, but room for improvement.',
      emoji: '🏠',
      color: 'text-yellow-700',
    }
  } else {
    rank = {
      rank: 'D',
      title: 'Underbaked',
      description: 'Needs a bit more time in the oven.',
      emoji: '🥚',
      color: 'text-zinc-500',
    }
  }

  return { score, rank }
}

