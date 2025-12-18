import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const redisEnabled = process.env.REDIS_ENABLED === 'true'
  const dynamodbEnabled = process.env.DYNAMODB_ENABLED === 'true'
  const leaderboardEnabled = process.env.LEADERBOARD_ENABLED === 'true'
  const isLeaderboardVisible = dynamodbEnabled && leaderboardEnabled
  const frontendDebugEnabled = process.env.FRONTEND_DEBUG_ENABLED === 'true'

  return NextResponse.json({
    REDIS_ENABLED: redisEnabled,
    DYNAMODB_ENABLED: dynamodbEnabled,
    LEADERBOARD_ENABLED: leaderboardEnabled,
    IS_LEADERBOARD_VISIBLE: isLeaderboardVisible,
    FRONTEND_DEBUG_ENABLED: frontendDebugEnabled,
  })
}

