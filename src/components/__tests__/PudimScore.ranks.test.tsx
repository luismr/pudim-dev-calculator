import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PudimScore } from '../PudimScore'
import { getPudimScore, wouldQualifyForTop10 } from '@/app/_server/actions'
import { TestWrapper } from '@/test/setup'

vi.mock('@/app/_server/actions', () => ({
  getPudimScore: vi.fn(),
  wouldQualifyForTop10: vi.fn(),
  updateLeaderboardConsent: vi.fn(),
  checkExistingConsent: vi.fn(),
}))

describe('PudimScore - All Rank Calculations', () => {
  it('calculates S+ rank (Legendary Flan) for score > 1000', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'legendary',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 500,  // 500 * 2 = 1000
        followers: 100,    // 100 * 0.5 = 50
        public_repos: 50,  // 50 * 1 = 50
        // Total: 1100 -> S+
        languages: [],
      },
      score: 1100,
      rank: {
        rank: 'S+',
        title: 'Legendary Flan',
        description: 'The texture is perfect, the caramel is divine. You are a coding god!',
        emoji: '🍮✨',
        color: 'text-amber-500',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)
    render(<PudimScore />, { wrapper: TestWrapper })
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'legendary')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Legendary Flan')).toBeInTheDocument()
      expect(screen.getByText('S+')).toBeInTheDocument()
    })
  })

  it('calculates A rank (Tasty Pudding) for score 200-499', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'tasty',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 100,  // 100 * 2 = 200
        followers: 100,    // 100 * 0.5 = 50
        public_repos: 50,  // 50 * 1 = 50
        // Total: 300 -> A
        languages: [],
      },
      score: 300,
      rank: {
        rank: 'A',
        title: 'Tasty Pudding',
        description: 'Everyone wants a slice. Great job!',
        emoji: '😋',
        color: 'text-orange-500',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)
    render(<PudimScore />, { wrapper: TestWrapper })
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'tasty')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Tasty Pudding')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  it('calculates B rank (Sweet Treat) for score 100-199', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'sweet',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 50,   // 50 * 2 = 100
        followers: 50,     // 50 * 0.5 = 25
        public_repos: 25,  // 25 * 1 = 25
        // Total: 150 -> B
        languages: [],
      },
      score: 150,
      rank: {
        rank: 'B',
        title: 'Sweet Treat',
        description: 'Solid and dependable. A good dessert.',
        emoji: '🍬',
        color: 'text-orange-400',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)
    render(<PudimScore />, { wrapper: TestWrapper })
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'sweet')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Sweet Treat')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })
  })

  it('calculates C rank (Homemade) for score 50-99', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'homemade',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 30,   // 30 * 2 = 60
        followers: 30,     // 30 * 0.5 = 15
        public_repos: 15,  // 15 * 1 = 15
        // Total: 90 -> C
        languages: [],
      },
      score: 90,
      rank: {
        rank: 'C',
        title: 'Homemade',
        description: 'Made with love, but room for improvement.',
        emoji: '🏠',
        color: 'text-yellow-700',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)
    render(<PudimScore />, { wrapper: TestWrapper })
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'homemade')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Homemade')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
    })
  })

  it('calculates D rank (Underbaked) for score < 50', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'newbie',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 10,   // 10 * 2 = 20
        followers: 20,     // 20 * 0.5 = 10
        public_repos: 10,  // 10 * 1 = 10
        // Total: 40 -> D
        languages: [],
      },
      score: 40,
      rank: {
        rank: 'D',
        title: 'Underbaked',
        description: 'Needs a bit more time in the oven.',
        emoji: '🥚',
        color: 'text-zinc-500',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)
    render(<PudimScore />, { wrapper: TestWrapper })
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'newbie')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Underbaked')).toBeInTheDocument()
      expect(screen.getByText('D')).toBeInTheDocument()
    })
  })

  it('displays share buttons after calculating score', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 100,
        followers: 50,
        public_repos: 25,
        languages: [],
      },
      score: 275,
      rank: {
        rank: 'A',
        title: 'Tasty Pudding',
        description: 'Everyone wants a slice. Great job!',
        emoji: '😋',
        color: 'text-orange-500',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)
    vi.mocked(wouldQualifyForTop10).mockResolvedValue(false) // Don't qualify, so share buttons show outside consent block
    render(<PudimScore />, { wrapper: TestWrapper })
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'testuser')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    // Wait for result to be displayed first
    await waitFor(() => {
      expect(screen.getByText('Tasty Pudding')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Share buttons should be visible once result is displayed
    // They're always rendered when result exists, so wait for them
    await waitFor(() => {
      expect(screen.getByTitle('Share on X')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    expect(screen.getByTitle('Share on Bluesky')).toBeInTheDocument()
    expect(screen.getByTitle('Share on Facebook')).toBeInTheDocument()
    expect(screen.getByTitle('Share on LinkedIn')).toBeInTheDocument()
  })
})

