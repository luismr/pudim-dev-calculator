'use client'

import { useEffect } from 'react'
import { useEnv } from '@/contexts/EnvContext'
import { logger } from '@/lib/logger'

export function DebugLogger() {
  const { env, loading } = useEnv()

  useEffect(() => {
    // Only log debug info if FRONTEND_DEBUG_ENABLED is true
    if (!loading && env) {
      logger.log('🔍 Frontend Debug Info:', env)
    }
  }, [env, loading])
  
  return null
}

