import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PudimScore } from '../PudimScore'
import { getPudimScore } from '@/app/_server/actions'
import { TestWrapper } from '@/test/setup'

// Mock the server action
vi.mock('@/app/_server/actions', () => ({
  getPudimScore: vi.fn(),
  updateLeaderboardConsent: vi.fn(),
  wouldQualifyForTop10: vi.fn(),
  checkExistingConsent: vi.fn(),
}))

describe('PudimScore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the input field and calculate button', () => {
    render(<PudimScore />, { wrapper: TestWrapper })
    
    expect(screen.getByPlaceholderText('GitHub Username')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Calculate/i })).toBeInTheDocument()
  })

  it('does not show results initially', () => {
    render(<PudimScore />, { wrapper: TestWrapper })
    
    expect(screen.queryByText(/Master Pudim/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/STARS/i)).not.toBeInTheDocument()
  })

  it('disables button and input while loading', async () => {
    const user = userEvent.setup()
    vi.mocked(getPudimScore).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: 'Not found' }), 100))
    )

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'testuser')
    await user.click(button)

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('displays error message when user is not found', async () => {
    const user = userEvent.setup()
    vi.mocked(getPudimScore).mockResolvedValue({
      error: 'User not found',
    })

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'nonexistentuser')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })

  it('displays user stats when successful', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 222,
        followers: 87,
        public_repos: 96,
        languages: [
          { name: 'Java', count: 39, percentage: 39 },
          { name: 'Python', count: 18, percentage: 18 },
        ],
      },
      score: 583.5,
      rank: {
        rank: 'S',
        title: 'Master Pudim',
        description: 'A delicious result. Michelin star worthy.',
        emoji: '🍮',
        color: 'text-yellow-600',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'testuser')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
      expect(screen.getByText('222')).toBeInTheDocument()
      expect(screen.getByText('87')).toBeInTheDocument()
      expect(screen.getByText('96')).toBeInTheDocument()
      expect(screen.getByText(/STARS/i)).toBeInTheDocument()
      expect(screen.getByText(/FOLLOWERS/i)).toBeInTheDocument()
      expect(screen.getByText(/REPOS/i)).toBeInTheDocument()
    })
  })

  it('displays correct rank for high score (Master Pudim)', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'highscorer',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 222, // 222 * 2 = 444
        followers: 87,    // 87 * 0.5 = 43.5
        public_repos: 96, // 96 * 1 = 96
        // Total score: 444 + 43.5 + 96 = 583.5 (S rank - Master Pudim)
        languages: [],
      },
      score: 583.5,
      rank: {
        rank: 'S',
        title: 'Master Pudim',
        description: 'A delicious result. Michelin star worthy.',
        emoji: '🍮',
        color: 'text-yellow-600',
      },
    }

    vi.mocked(getPudimScore).mockResolvedValue(mockResult)

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'highscorer')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Master Pudim')).toBeInTheDocument()
      expect(screen.getByText('S')).toBeInTheDocument()
    })
  })

  it('loads initial username when provided', async () => {
    const mockResult = {
      stats: {
        username: 'initialuser',
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

    render(<PudimScore initialUsername="initialuser" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText('initialuser')).toBeInTheDocument()
    })
  })

  it('displays languages when available', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'languageuser',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 100,
        followers: 50,
        public_repos: 25,
        languages: [
          { name: 'TypeScript', count: 50, percentage: 50 },
          { name: 'JavaScript', count: 30, percentage: 30 },
          { name: 'Python', count: 20, percentage: 20 },
        ],
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

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'languageuser')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Pudim Flavors/i)).toBeInTheDocument()
      expect(screen.getByText(/TypeScript/i)).toBeInTheDocument()
      expect(screen.getByText(/JavaScript/i)).toBeInTheDocument()
      expect(screen.getByText(/Python/i)).toBeInTheDocument()
    })
  })

  it('shows rank info button when results are displayed', async () => {
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

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'testuser')
    await user.click(button)

    await waitFor(() => {
      const infoButton = screen.getByTitle('View ranking thresholds')
      expect(infoButton).toBeInTheDocument()
    })
  })

  it('handles unexpected errors in catch block', async () => {
    const user = userEvent.setup()
    vi.mocked(getPudimScore).mockRejectedValue(new Error('Unexpected error'))

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'testuser')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/An unexpected error occurred. Please try again./)).toBeInTheDocument()
    })
  })

  it('does not load stats when username is empty or whitespace', async () => {
    const user = userEvent.setup()
    vi.mocked(getPudimScore).mockResolvedValue({
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
    })

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    // Try with empty string
    await user.click(button)
    
    // Try with whitespace
    await user.type(input, '   ')
    await user.click(button)

    // Should not have called getPudimScore
    expect(getPudimScore).not.toHaveBeenCalled()
  })

  it('displays languages with fallback color when language not in map', async () => {
    const user = userEvent.setup()
    const mockResult = {
      stats: {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2012-01-01T00:00:00Z',
        total_stars: 100,
        followers: 50,
        public_repos: 25,
        languages: [
          { name: 'UnknownLanguage', count: 1, percentage: 100 },
        ],
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

    render(<PudimScore />, { wrapper: TestWrapper })
    
    const input = screen.getByPlaceholderText('GitHub Username')
    const button = screen.getByRole('button', { name: /Calculate/i })

    await user.type(input, 'testuser')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Pudim Flavors/i)).toBeInTheDocument()
      expect(screen.getByText(/UnknownLanguage/i)).toBeInTheDocument()
    })
  })
})

