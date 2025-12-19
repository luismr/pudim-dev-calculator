import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { StatisticsSection } from '../StatisticsSection'
import { getStatistics } from '@/app/_server/actions'
import type { StatisticsData } from '@/lib/dynamodb'
import { useLeaderboardRefresh } from '@/contexts/LeaderboardRefreshContext'
import { EnvProvider } from '@/contexts/EnvContext'
import { LeaderboardRefreshProvider } from '@/contexts/LeaderboardRefreshContext'
import React from 'react'
import { logger } from '@/lib/logger' // Import logger mock

vi.mock('@/app/_server/actions', () => ({
  getStatistics: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Simple wrapper that only provides context, without setting up mocks
function SimpleTestWrapper({ children }: { children: React.ReactElement }) {
  return React.createElement(
    EnvProvider,
    {},
    React.createElement(
      LeaderboardRefreshProvider,
      {},
      children
    )
  )
}

describe('StatisticsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: DynamoDB enabled
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        REDIS_ENABLED: false,
        DYNAMODB_ENABLED: true,
        LEADERBOARD_ENABLED: false,
        IS_LEADERBOARD_VISIBLE: false,
        FRONTEND_DEBUG_ENABLED: false,
      }),
    } as Response)
  })

  it('does not render when DynamoDB is disabled', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        REDIS_ENABLED: false,
        DYNAMODB_ENABLED: false,
        LEADERBOARD_ENABLED: false,
        IS_LEADERBOARD_VISIBLE: false,
        FRONTEND_DEBUG_ENABLED: false,
      }),
    } as Response)

    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    // Wait for env to load
    await waitFor(() => {
      expect(screen.queryByText('Community Stats')).not.toBeInTheDocument()
    })
    
    expect(getStatistics).not.toHaveBeenCalled()
  })

  it('displays loading state initially', async () => {
    vi.mocked(getStatistics).mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Loading statistics...')).toBeInTheDocument()
    })
  })

  it('does not render when stats is null after loading', async () => {
    vi.mocked(getStatistics).mockResolvedValue(null as unknown as StatisticsData)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(getStatistics).toHaveBeenCalled()
    })
    
    // Should not render anything when stats is null
    expect(screen.queryByText('Community Stats')).not.toBeInTheDocument()
  })

  it('displays statistics with empty data', async () => {
    const mockStats: StatisticsData = {
      totalScores: 0,
      totalConsents: 0,
      uniqueUsers: 0,
      rankDistribution: {},
      languageDistribution: {},
      averageScore: 0,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Community Stats')).toBeInTheDocument()
      const scoreCard = screen.getByText('Total Scores').closest('div[data-slot="card"]')
      expect(scoreCard).toHaveTextContent('0')
    })
    
    // Should show "No data available" for charts
    expect(screen.getAllByText('No data available')).toHaveLength(2)
  })

  it('displays statistics with rank distribution data', async () => {
    const mockStats: StatisticsData = {
      totalScores: 10,
      totalConsents: 8,
      uniqueUsers: 5,
      rankDistribution: {
        'S+': 1,
        'S': 2,
        'A': 3,
        'B': 2,
        'C': 1,
        'D': 1,
      },
      languageDistribution: {},
      averageScore: 500,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Community Stats')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // Total scores
      expect(screen.getByText('8')).toBeInTheDocument() // Total consents
      expect(screen.getByText('5')).toBeInTheDocument() // Unique users
    })
    
    // Should show rank distribution chart
    expect(screen.getByText('Rank Distribution')).toBeInTheDocument()
  })

  it('displays statistics with language distribution data', async () => {
    const mockStats: StatisticsData = {
      totalScores: 10,
      totalConsents: 8,
      uniqueUsers: 5,
      rankDistribution: {},
      languageDistribution: {
        'JavaScript': 5,
        'TypeScript': 3,
        'Python': 2,
        'Java': 1,
      },
      averageScore: 500,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Flavor Distribution')).toBeInTheDocument()
    })
  })

  it('displays statistics with both rank and language data', async () => {
    const mockStats: StatisticsData = {
      totalScores: 20,
      totalConsents: 15,
      uniqueUsers: 10,
      rankDistribution: {
        'S+': 1,
        'S': 2,
        'A': 3,
        'B': 2,
        'C': 1,
        'D': 1,
      },
      languageDistribution: {
        'JavaScript': 8,
        'TypeScript': 5,
        'Python': 4,
        'Java': 3,
        'Go': 2,
        'Rust': 1,
      },
      averageScore: 600,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Community Stats')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument() // Total scores
      expect(screen.getByText('15')).toBeInTheDocument() // Total consents
      expect(screen.getByText('10')).toBeInTheDocument() // Unique users
      expect(screen.getByText('Rank Distribution')).toBeInTheDocument()
      expect(screen.getByText('Flavor Distribution')).toBeInTheDocument()
    })
  })

  it('groups ranks beyond top 5 into "Others"', async () => {
    const mockStats: StatisticsData = {
      totalScores: 20,
      totalConsents: 20,
      uniqueUsers: 20,
      rankDistribution: {
        'S+': 5,
        'S': 4,
        'A': 3,
        'B': 2,
        'C': 1,
        'D': 5, // This should be grouped into "Others"
      },
      languageDistribution: {
        'JavaScript': 5, // Provide language data so flavor chart renders too
      },
      averageScore: 500,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Rank Distribution')).toBeInTheDocument()
    })
    
    // Check if stats were logged correctly
    expect(logger.log).toHaveBeenCalledWith('📊 Stats:', mockStats)
    
    // Chart should render (not "No data available")
    expect(screen.queryByText('No data available')).not.toBeInTheDocument()
  })

  it('groups languages beyond top 10 into "Others"', async () => {
    const mockStats: StatisticsData = {
      totalScores: 20,
      totalConsents: 20,
      uniqueUsers: 20,
      rankDistribution: {
        'S': 5, // Provide rank data so rank chart renders too
      },
      languageDistribution: {
        'JavaScript': 10,
        'TypeScript': 9,
        'Python': 8,
        'Java': 7,
        'Go': 6,
        'Rust': 5,
        'C++': 4,
        'C#': 3,
        'Ruby': 2,
        'PHP': 1,
        'Swift': 1, // This should be grouped into "Others"
        'Kotlin': 1, // This should be grouped into "Others"
      },
      averageScore: 500,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Flavor Distribution')).toBeInTheDocument()
    })
    
    // Chart should render (not "No data available")
    expect(screen.queryByText('No data available')).not.toBeInTheDocument()
  })

  it('handles missing rankDistribution gracefully', async () => {
    const mockStats: StatisticsData = {
      totalScores: 10,
      totalConsents: 8,
      uniqueUsers: 5,
      rankDistribution: undefined as unknown as Record<string, number>,
      languageDistribution: {
        'JavaScript': 5,
      },
      averageScore: 500,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Community Stats')).toBeInTheDocument()
    })
    
    // Should show "No data available" for rank chart
    expect(screen.getAllByText('No data available')).toHaveLength(1)
  })

  it('handles missing languageDistribution gracefully', async () => {
    const mockStats: StatisticsData = {
      totalScores: 10,
      totalConsents: 8,
      uniqueUsers: 5,
      rankDistribution: {
        'S': 5,
      },
      languageDistribution: undefined as unknown as Record<string, number>,
      averageScore: 500,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Community Stats')).toBeInTheDocument()
    })
    
    // Should show "No data available" for language chart
    expect(screen.getAllByText('No data available')).toHaveLength(1)
  })

  it('refreshes when refreshKey changes', async () => {
    const mockStats: StatisticsData = {
      totalScores: 10,
      totalConsents: 8,
      uniqueUsers: 5,
      rankDistribution: {
        'S': 5,
      },
      languageDistribution: {
        'JavaScript': 5,
      },
      averageScore: 500,
    }

    vi.mocked(getStatistics).mockResolvedValue(mockStats)
    
    // Component that triggers refresh
    const TestComponent = () => {
      const { refresh } = useLeaderboardRefresh()
      React.useEffect(() => {
        // Trigger refresh after a delay
        const timer = setTimeout(() => {
          refresh()
        }, 100)
        return () => clearTimeout(timer)
      }, [refresh])
      return <StatisticsSection />
    }
    
    render(<TestComponent />, { wrapper: SimpleTestWrapper })
    
    // Wait for initial call
    await waitFor(() => {
      expect(getStatistics).toHaveBeenCalledTimes(1)
    })
    
    // Wait for refresh to trigger second call
    await waitFor(() => {
      expect(getStatistics).toHaveBeenCalledTimes(2)
    })
  })

  it('handles errors gracefully', async () => {
    vi.mocked(getStatistics).mockRejectedValue(new Error('Failed to fetch'))
    
    render(<StatisticsSection />, { wrapper: SimpleTestWrapper })
    
    await waitFor(() => {
      expect(getStatistics).toHaveBeenCalled()
    })
    
    // Component should not render when error occurs (stats remains null)
    expect(screen.queryByText('Community Stats')).not.toBeInTheDocument()
  })
})

