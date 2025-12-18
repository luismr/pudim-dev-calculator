'use client'

import { Badge } from "@/components/ui/badge"
import { Leaderboard } from "@/components/Leaderboard"
import { useEnv } from "@/contexts/EnvContext"

export function LeaderboardSection() {
  const { env, loading } = useEnv()
  
  // Show leaderboard only if enabled and both DynamoDB and Leaderboard are enabled
  const showLeaderboard = env?.IS_LEADERBOARD_VISIBLE ?? false

  if (loading || !showLeaderboard) {
    return null
  }

  return (
    <section id="leaderboard" className="w-full py-12 md:py-24 lg:py-32 bg-background scroll-mt-14">
      <div className="container px-4 md:px-6 mx-auto text-center">
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
          <Badge variant="secondary" className="rounded-full">Leaderboard</Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            Top 10 Pudim Scores
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
            See who has the sweetest developer profile on GitHub
          </p>
        </div>
        <Leaderboard />
      </div>
    </section>
  )
}

