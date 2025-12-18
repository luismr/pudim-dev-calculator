import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Leaderboard } from '../Leaderboard'
import { getTopScores } from '@/app/_server/actions'
import type { TopScoreEntry } from '@/lib/dynamodb'
import { TestWrapper } from '@/test/setup'

vi.mock('@/app/_server/actions', () => ({
  getTopScores: vi.fn(),
}))

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays loading state initially', () => {
    vi.mocked(getTopScores).mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    expect(screen.getByText('🏆 Top 10 Pudim Scores')).toBeInTheDocument()
    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument()
  })

  it('displays error state when getTopScores returns error', async () => {
    vi.mocked(getTopScores).mockResolvedValue({ error: 'Leaderboard is not enabled' })
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Leaderboard is not enabled')).toBeInTheDocument()
    })
  })

  it('displays error state when getTopScores throws', async () => {
    vi.mocked(getTopScores).mockRejectedValue(new Error('Network error'))
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load leaderboard')).toBeInTheDocument()
    })
  })

  it('displays empty state when no scores exist', async () => {
    vi.mocked(getTopScores).mockResolvedValue([])
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('No scores yet. Be the first to calculate your pudim score!')).toBeInTheDocument()
    })
  })

  it('displays top scores when available', async () => {
    const mockScores: TopScoreEntry[] = [
      {
        username: 'user1',
        timestamp: '2023-12-17T10:00:00.000Z',
        score: 1500,
        rank: {
          rank: 'S+',
          title: 'Legendary Flan',
          description: 'The texture is perfect',
          emoji: '🍮✨',
          color: 'text-amber-500',
        },
        avatar_url: 'https://example.com/user1.jpg',
        followers: 500,
        total_stars: 600,
        public_repos: 100,
      },
      {
        username: 'user2',
        timestamp: '2023-12-17T09:00:00.000Z',
        score: 800,
        rank: {
          rank: 'S',
          title: 'Master Pudim',
          description: 'A delicious result',
          emoji: '🍮',
          color: 'text-yellow-600',
        },
        avatar_url: 'https://example.com/user2.jpg',
        followers: 200,
        total_stars: 300,
        public_repos: 50,
      },
    ]

    vi.mocked(getTopScores).mockResolvedValue(mockScores)
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
    })

    // Check for medals/ranks
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('🥈')).toBeInTheDocument()
    
    // Check for scores
    expect(screen.getByText('1500')).toBeInTheDocument()
    expect(screen.getByText('800')).toBeInTheDocument()
    
    // Check for rank badges
    expect(screen.getByText('🍮✨ S+')).toBeInTheDocument()
    expect(screen.getByText('🍮 S')).toBeInTheDocument()
    
    // Check for title badges (should be visible on wider screens)
    expect(screen.getByText('Legendary Flan')).toBeInTheDocument()
    expect(screen.getByText('Master Pudim')).toBeInTheDocument()
  })

  it('displays stats for each entry', async () => {
    const mockScores: TopScoreEntry[] = [
      {
        username: 'user1',
        timestamp: '2023-12-17T10:00:00.000Z',
        score: 1500,
        rank: {
          rank: 'S+',
          title: 'Legendary Flan',
          description: 'The texture is perfect',
          emoji: '🍮✨',
          color: 'text-amber-500',
        },
        avatar_url: 'https://example.com/user1.jpg',
        followers: 500,
        total_stars: 600,
        public_repos: 100,
      },
    ]

    vi.mocked(getTopScores).mockResolvedValue(mockScores)
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('500 followers')).toBeInTheDocument()
      expect(screen.getByText('600 stars')).toBeInTheDocument()
      expect(screen.getByText('100 repos')).toBeInTheDocument()
    })
  })

  it('displays disclaimer text', async () => {
    const mockScores: TopScoreEntry[] = [
      {
        username: 'user1',
        timestamp: '2023-12-17T10:00:00.000Z',
        score: 1500,
        rank: {
          rank: 'S+',
          title: 'Legendary Flan',
          description: 'The texture is perfect',
          emoji: '🍮✨',
          color: 'text-amber-500',
        },
        avatar_url: 'https://example.com/user1.jpg',
        followers: 500,
        total_stars: 600,
        public_repos: 100,
      },
    ]

    vi.mocked(getTopScores).mockResolvedValue(mockScores)
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      const container = screen.getByText('🏆 Top 10 Pudim Scores').closest('[data-slot="card"]')
      expect(container).toHaveTextContent('Scores are updated every time someone calculates their pudim score.')
      expect(container).toHaveTextContent('Only users who have given consent appear in the leaderboard.')
    })
  })

  it('displays formatted date for each entry', async () => {
    const mockScores: TopScoreEntry[] = [
      {
        username: 'user1',
        timestamp: '2023-12-17T10:00:00.000Z',
        score: 1500,
        rank: {
          rank: 'S+',
          title: 'Legendary Flan',
          description: 'The texture is perfect',
          emoji: '🍮✨',
          color: 'text-amber-500',
        },
        avatar_url: 'https://example.com/user1.jpg',
        followers: 500,
        total_stars: 600,
        public_repos: 100,
      },
    ]

    vi.mocked(getTopScores).mockResolvedValue(mockScores)
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      const dateElement = screen.getByText(new Date('2023-12-17T10:00:00.000Z').toLocaleDateString())
      expect(dateElement).toBeInTheDocument()
    })
  })

  it('displays bronze medal for third place', async () => {
    const mockScores: TopScoreEntry[] = [
      {
        username: 'user1',
        timestamp: '2023-12-17T10:00:00.000Z',
        score: 1500,
        rank: {
          rank: 'S+',
          title: 'Legendary Flan',
          description: 'The texture is perfect',
          emoji: '🍮✨',
          color: 'text-amber-500',
        },
        avatar_url: 'https://example.com/user1.jpg',
        followers: 500,
        total_stars: 600,
        public_repos: 100,
      },
      {
        username: 'user2',
        timestamp: '2023-12-17T09:00:00.000Z',
        score: 1200,
        rank: {
          rank: 'S',
          title: 'Master Pudim',
          description: 'A delicious result',
          emoji: '🍮',
          color: 'text-yellow-600',
        },
        avatar_url: 'https://example.com/user2.jpg',
        followers: 200,
        total_stars: 300,
        public_repos: 50,
      },
      {
        username: 'user3',
        timestamp: '2023-12-17T08:00:00.000Z',
        score: 800,
        rank: {
          rank: 'S',
          title: 'Master Pudim',
          description: 'A delicious result',
          emoji: '🍮',
          color: 'text-yellow-600',
        },
        avatar_url: 'https://example.com/user3.jpg',
        followers: 150,
        total_stars: 200,
        public_repos: 30,
      },
    ]

    vi.mocked(getTopScores).mockResolvedValue(mockScores)
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('🥉')).toBeInTheDocument()
    })
  })

  it('displays number rank for positions after 3rd place', async () => {
    const mockScores: TopScoreEntry[] = Array.from({ length: 5 }, (_, i) => ({
      username: `user${i + 1}`,
      timestamp: '2023-12-17T10:00:00.000Z',
      score: 1000 - i * 100,
      rank: {
        rank: 'S',
        title: 'Master Pudim',
        description: 'A delicious result',
        emoji: '🍮',
        color: 'text-yellow-600',
      },
      avatar_url: `https://example.com/user${i + 1}.jpg`,
      followers: 100,
      total_stars: 200,
      public_repos: 20,
    }))

    vi.mocked(getTopScores).mockResolvedValue(mockScores)
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('#4')).toBeInTheDocument()
      expect(screen.getByText('#5')).toBeInTheDocument()
    })
  })

  it('creates correct links to calculator pages', async () => {
    const mockScores: TopScoreEntry[] = [
      {
        username: 'user1',
        timestamp: '2023-12-17T10:00:00.000Z',
        score: 1500,
        rank: {
          rank: 'S+',
          title: 'Legendary Flan',
          description: 'The texture is perfect',
          emoji: '🍮✨',
          color: 'text-amber-500',
        },
        avatar_url: 'https://example.com/user1.jpg',
        followers: 500,
        total_stars: 600,
        public_repos: 100,
      },
    ]

    vi.mocked(getTopScores).mockResolvedValue(mockScores)
    
    render(<Leaderboard />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'user1' })
      expect(link).toHaveAttribute('href', '/calculator/user1')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})

