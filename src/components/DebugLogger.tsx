'use client'

import { useEffect } from 'react'

interface DebugLoggerProps {
  redisEnabled: boolean
  dynamodbEnabled: boolean
  leaderboardEnabled: boolean
  isLeaderboardVisible: boolean
}

export function DebugLogger({ 
  redisEnabled, 
  dynamodbEnabled, 
  leaderboardEnabled, 
  isLeaderboardVisible 
}: DebugLoggerProps) {
  useEffect(() => {
    console.log('🔍 Frontend Debug Info:', {
      REDIS_ENABLED: redisEnabled,
      DYNAMODB_ENABLED: dynamodbEnabled,
      LEADERBOARD_ENABLED: leaderboardEnabled,
      IS_LEADERBOARD_VISIBLE: isLeaderboardVisible
    })
  }, [redisEnabled, dynamodbEnabled, leaderboardEnabled, isLeaderboardVisible])
  
  return null
}

