export type PudimRank = {
  rank: string
  title: string
  description: string
  emoji: string
  color: string
}

export type GitHubStats = {
  username: string
  avatar_url: string
  followers: number
  total_stars: number
  public_repos: number
  created_at: string
  languages?: Array<{ name: string; count: number; percentage: number }>
}

export type PudimScoreResult = {
  stats: GitHubStats
  score: number
  rank: PudimRank
}

export type PudimError = {
  error: string
}

