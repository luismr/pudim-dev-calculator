'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface EnvValues {
  REDIS_ENABLED: boolean
  DYNAMODB_ENABLED: boolean
  LEADERBOARD_ENABLED: boolean
  IS_LEADERBOARD_VISIBLE: boolean
  FRONTEND_DEBUG_ENABLED: boolean
}

interface EnvContextType {
  env: EnvValues | null
  loading: boolean
  error: Error | null
}

const EnvContext = createContext<EnvContextType>({
  env: null,
  loading: true,
  error: null,
})

export function useEnv() {
  const context = useContext(EnvContext)
  if (!context) {
    throw new Error('useEnv must be used within EnvProvider')
  }
  return context
}

interface EnvProviderProps {
  children: ReactNode
}

export function EnvProvider({ children }: EnvProviderProps) {
  const [env, setEnv] = useState<EnvValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Fetch environment variables from API route at runtime
    // This ensures we get the actual runtime values from the server,
    // not build-time values that may be undefined in static builds
    fetch('/api/debug/env')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        setEnv(data)
        setLoading(false)
      })
      .catch(err => {
        const error = err instanceof Error ? err : new Error('Failed to fetch environment variables')
        setError(error)
        setLoading(false)
        console.error('Failed to fetch environment variables:', error)
      })
  }, [])

  return (
    <EnvContext.Provider value={{ env, loading, error }}>
      {children}
    </EnvContext.Provider>
  )
}

