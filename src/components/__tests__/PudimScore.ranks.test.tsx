import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PudimScore } from '../PudimScore'
import { getGithubStats } from '@/app/actions'

vi.mock('@/app/actions', () => ({
  getGithubStats: vi.fn(),
}))

describe('PudimScore - All Rank Calculations', () => {
  it('calculates S+ rank (Legendary Flan) for score > 1000', async () => {
    const user = userEvent.setup()
    const mockStats = {
      username: 'legendary',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      total_stars: 500,  // 500 * 2 = 1000
      followers: 100,    // 100 * 0.5 = 50
      public_repos: 50,  // 50 * 1 = 50
      // Total: 1100 -> S+
      languages: [],
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    render(<PudimScore />)
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'legendary')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Legendary Flan')).toBeInTheDocument()
      expect(screen.getByText('S+')).toBeInTheDocument()
    })
  })

  it('calculates A rank (Tasty Pudding) for score 200-499', async () => {
    const user = userEvent.setup()
    const mockStats = {
      username: 'tasty',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      total_stars: 100,  // 100 * 2 = 200
      followers: 100,    // 100 * 0.5 = 50
      public_repos: 50,  // 50 * 1 = 50
      // Total: 300 -> A
      languages: [],
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    render(<PudimScore />)
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'tasty')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Tasty Pudding')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  it('calculates B rank (Sweet Treat) for score 100-199', async () => {
    const user = userEvent.setup()
    const mockStats = {
      username: 'sweet',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      total_stars: 50,   // 50 * 2 = 100
      followers: 50,     // 50 * 0.5 = 25
      public_repos: 25,  // 25 * 1 = 25
      // Total: 150 -> B
      languages: [],
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    render(<PudimScore />)
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'sweet')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Sweet Treat')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })
  })

  it('calculates C rank (Homemade) for score 50-99', async () => {
    const user = userEvent.setup()
    const mockStats = {
      username: 'homemade',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      total_stars: 30,   // 30 * 2 = 60
      followers: 30,     // 30 * 0.5 = 15
      public_repos: 15,  // 15 * 1 = 15
      // Total: 90 -> C
      languages: [],
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    render(<PudimScore />)
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'homemade')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Homemade')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
    })
  })

  it('calculates D rank (Underbaked) for score < 50', async () => {
    const user = userEvent.setup()
    const mockStats = {
      username: 'newbie',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      total_stars: 10,   // 10 * 2 = 20
      followers: 20,     // 20 * 0.5 = 10
      public_repos: 10,  // 10 * 1 = 10
      // Total: 40 -> D
      languages: [],
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    render(<PudimScore />)
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'newbie')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText('Underbaked')).toBeInTheDocument()
      expect(screen.getByText('D')).toBeInTheDocument()
    })
  })

  it('displays share buttons after calculating score', async () => {
    const user = userEvent.setup()
    const mockStats = {
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2012-01-01T00:00:00Z',
      total_stars: 100,
      followers: 50,
      public_repos: 25,
      languages: [],
    }

    vi.mocked(getGithubStats).mockResolvedValue(mockStats)
    render(<PudimScore />)
    
    await user.type(screen.getByPlaceholderText('GitHub Username'), 'testuser')
    await user.click(screen.getByRole('button', { name: /Calculate/i }))

    await waitFor(() => {
      expect(screen.getByText(/Share your score:/i)).toBeInTheDocument()
      expect(screen.getByTitle('Share on X')).toBeInTheDocument()
      expect(screen.getByTitle('Share on Bluesky')).toBeInTheDocument()
      expect(screen.getByTitle('Share on Facebook')).toBeInTheDocument()
      expect(screen.getByTitle('Share on LinkedIn')).toBeInTheDocument()
    })
  })
})

