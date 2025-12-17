/**
 * Example Leaderboard Component
 * 
 * This file demonstrates how to use the DynamoDB integration to display
 * the top 10 pudim scores. You can adapt this component to fit your needs.
 * 
 * To use this in your app:
 * 1. Copy this file to src/components/Leaderboard.tsx
 * 2. Add a route for it in src/app/leaderboard/page.tsx
 * 3. Update your navigation to include a link to the leaderboard
 */

'use client'

import { useEffect, useState } from 'react'
import { getTopScores } from '@/app/_server/actions'
import type { TopScoreEntry } from '@/lib/dynamodb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function Leaderboard() {
  const [topScores, setTopScores] = useState<TopScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTopScores() {
      try {
        const result = await getTopScores()
        
        if ('error' in result) {
          setError(result.error)
        } else {
          setTopScores(result)
        }
      } catch (err) {
        setError('Failed to load leaderboard')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopScores()
  }, [])

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
                {/* Rank */}
                <div className="text-2xl font-bold w-12 text-center">
                  {medal}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.avatar_url} alt={entry.username} />
                  <AvatarFallback>{entry.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{entry.followers} followers</span>
                    <span className="mx-2">•</span>
                    <span>{entry.total_stars} stars</span>
                    <span className="mx-2">•</span>
                    <span>{entry.public_repos} repos</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold">{entry.score.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Refresh Note */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Scores are updated every time someone calculates their pudim score
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Example: Create a page for the leaderboard
 * 
 * File: src/app/leaderboard/page.tsx
 * 
 * import { Leaderboard } from '@/components/Leaderboard'
 * 
 * export default function LeaderboardPage() {
 *   return (
 *     <main className="min-h-screen p-8">
 *       <Leaderboard />
 *     </main>
 *   )
 * }
 * 
 * export const metadata = {
 *   title: 'Leaderboard | pudim.dev',
 *   description: 'Top 10 GitHub Pudim Scores',
 * }
 */

