'use client'

import { useEffect } from 'react'
import { useEnv } from '@/contexts/EnvContext'

export function DebugLogger() {
  const { env, loading } = useEnv()

  useEffect(() => {
    // Only log debug info if FRONTEND_DEBUG_ENABLED is true
    if (!loading && env && env.FRONTEND_DEBUG_ENABLED) {
      console.log('🔍 Frontend Debug Info:', env)
    }
  }, [env, loading])
  
  return null
}

