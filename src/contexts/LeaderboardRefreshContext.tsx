'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LeaderboardRefreshContextType {
  refreshKey: number
  refresh: () => void
}

const LeaderboardRefreshContext = createContext<LeaderboardRefreshContextType | undefined>(undefined)

export function useLeaderboardRefresh() {
  const context = useContext(LeaderboardRefreshContext)
  if (!context) {
    throw new Error('useLeaderboardRefresh must be used within LeaderboardRefreshProvider')
  }
  return context
}

interface LeaderboardRefreshProviderProps {
  children: ReactNode
}

export function LeaderboardRefreshProvider({ children }: LeaderboardRefreshProviderProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    console.log('🔄 Refreshing leaderboard...')
    setRefreshKey(prev => {
      const newKey = prev + 1
      console.log('🔄 Leaderboard refreshKey changed:', prev, '->', newKey)
      return newKey
    })
  }, [])

  return (
    <LeaderboardRefreshContext.Provider value={{ refreshKey, refresh }}>
      {children}
    </LeaderboardRefreshContext.Provider>
  )
}

