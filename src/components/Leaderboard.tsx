'use client'

import { useEffect, useState } from 'react'
import { getTopScores } from '@/app/_server/actions'
import type { TopScoreEntry } from '@/lib/dynamodb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useLeaderboardRefresh } from '@/contexts/LeaderboardRefreshContext'

export function Leaderboard() {
  const [topScores, setTopScores] = useState<TopScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { refreshKey } = useLeaderboardRefresh()

  useEffect(() => {
    console.log('📊 Leaderboard useEffect triggered, refreshKey:', refreshKey)
    async function fetchTopScores() {
      setLoading(true)
      setError(null)
      try {
        console.log('📊 Fetching top scores...')
        const result = await getTopScores()
        
        if ('error' in result) {
          console.error('📊 Error fetching top scores:', result.error)
          setError(result.error)
        } else {
          console.log('📊 Top scores fetched successfully, count:', result.length)
          setTopScores(result)
          setError(null)
        }
      } catch (err) {
        console.error('📊 Failed to load leaderboard:', err)
        setError('Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchTopScores()
  }, [refreshKey])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🏆 Top 10 Pudim Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading leaderboard...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🏆 Top 10 Pudim Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (topScores.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🏆 Top 10 Pudim Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            No scores yet. Be the first to calculate your pudim score!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">
          🏆 Top 10 Pudim Scores
        </CardTitle>
        <p className="text-center text-muted-foreground">
          The sweetest developers on GitHub
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topScores.map((entry, index) => {
            const medals = ['🥇', '🥈', '🥉']
            const medal = index < 3 ? medals[index] : `#${index + 1}`
            
            return (
              <div
                key={`${entry.username}-${entry.timestamp}`}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                {/* Rank - hidden on narrow screens */}
                <div className="text-2xl font-bold w-12 text-center hidden md:block">
                  {medal}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={entry.avatar_url} alt={entry.username} />
                  <AvatarFallback>{entry.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* User Info - Vertically centered with avatar */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                  {/* Username and badges on the left */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/calculator/${entry.username}`}
                      className="font-semibold hover:underline truncate"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {entry.username}
                    </a>
                    <Badge variant="secondary" className={entry.rank.color}>
                      {entry.rank.emoji} {entry.rank.rank}
                    </Badge>
                    {/* Ranking title badge - visible on wider screens only */}
                    <Badge variant="outline" className="hidden md:inline-flex">
                      {entry.rank.title}
                    </Badge>
                  </div>

                  {/* Stats centered in the middle - hidden on narrow screens */}
                  <div className="hidden md:flex text-sm text-muted-foreground items-center gap-2 flex-1 justify-center">
                    <span>{entry.followers} followers</span>
                    <span>•</span>
                    <span>{entry.total_stars} stars</span>
                    <span>•</span>
                    <span>{entry.public_repos} repos</span>
                  </div>

                  {/* Score on the right */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold">{entry.score.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Refresh Note */}
        <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
          <div>Scores are updated every time someone calculates their pudim score.</div>
          <div>Only users who have given consent appear in the leaderboard.</div>
        </div>
      </CardContent>
    </Card>
  )
}

