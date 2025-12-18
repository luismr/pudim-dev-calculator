import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'
import { TestWrapper } from '@/test/setup'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />, { wrapper: TestWrapper })
    expect(screen.getByText(/Calculate Your/i)).toBeInTheDocument()
    expect(screen.getByText(/Dev Pudim Score/i)).toBeInTheDocument()
  })

  it('displays the hero section description', () => {
    render(<Home />, { wrapper: TestWrapper })
    expect(screen.getByText(/Discover your flavor profile in the developer world/i)).toBeInTheDocument()
  })

  it('contains navigation buttons', () => {
    render(<Home />, { wrapper: TestWrapper })
    expect(screen.getByRole('link', { name: /Check My Score/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /How it Works/i })).toBeInTheDocument()
  })

  it('displays the PudimScore calculator component', () => {
    render(<Home />, { wrapper: TestWrapper })
    expect(screen.getByPlaceholderText('GitHub Username')).toBeInTheDocument()
  })

  it('shows feature cards', () => {
    render(<Home />, { wrapper: TestWrapper })
    expect(screen.getByText(/Ingredients \(Stats\)/i)).toBeInTheDocument()
    expect(screen.getByText(/The Secret Sauce/i)).toBeInTheDocument()
    expect(screen.getByText(/Open Source Spirit/i)).toBeInTheDocument()
  })

  it('mentions github-readme-stats inspiration', () => {
    render(<Home />, { wrapper: TestWrapper })
    // Use getAllByText since it appears multiple times
    const links = screen.getAllByText(/github-readme-stats/i)
    expect(links.length).toBeGreaterThan(0)
  })

  it('has proper section IDs for navigation', () => {
    const { container } = render(<Home />, { wrapper: TestWrapper })
    expect(container.querySelector('#calculator')).toBeInTheDocument()
    expect(container.querySelector('#features')).toBeInTheDocument()
  })

  it('contains pudim emoji', () => {
    const { container } = render(<Home />, { wrapper: TestWrapper })
    // The emoji is in the h1, check using text content
    expect(container.textContent).toContain('🍮')
  })
})

