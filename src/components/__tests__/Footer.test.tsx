import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Footer } from '../Footer'

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(min-width: 768px)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the footer element', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  it('contains copyright information with current year', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`Copyright © ${currentYear}`))).toBeInTheDocument()
  })

  it('contains Luis Machado Reis link', () => {
    render(<Footer />)
    const luisLink = screen.getByRole('link', { name: /Luis Machado Reis/i })
    expect(luisLink).toBeInTheDocument()
    expect(luisLink).toHaveAttribute('href', 'https://luismachadoreis.dev')
    expect(luisLink).toHaveAttribute('target', '_blank')
    expect(luisLink).toHaveAttribute('rel', 'noreferrer')
  })

  it('contains SingularIdeas link', () => {
    render(<Footer />)
    const singularLinks = screen.getAllByRole('link', { name: /SingularIdeas/i })
    expect(singularLinks.length).toBeGreaterThan(0)
    // Check that at least one link has the correct attributes
    const singularLink = singularLinks.find(link => 
      link.getAttribute('href') === 'https://singularideas.com.br'
    )
    expect(singularLink).toBeInTheDocument()
    expect(singularLink).toHaveAttribute('href', 'https://singularideas.com.br')
    expect(singularLink).toHaveAttribute('target', '_blank')
    expect(singularLink).toHaveAttribute('rel', 'noreferrer')
  })

  it('contains GitHub link', () => {
    render(<Footer />)
    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i })
    expect(githubLinks.length).toBeGreaterThan(0)
    // Check that at least one link has the correct attributes
    const githubLink = githubLinks.find(link => 
      link.getAttribute('href') === 'https://github.com/luismr/pudim-dev-calculator'
    )
    expect(githubLink).toBeInTheDocument()
    expect(githubLink).toHaveAttribute('href', 'https://github.com/luismr/pudim-dev-calculator')
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noreferrer')
  })

  it('has proper link attributes for security', () => {
    render(<Footer />)
    const links = screen.getAllByRole('link')
    
    links.forEach(link => {
      if (link.getAttribute('target') === '_blank') {
        expect(link).toHaveAttribute('rel', 'noreferrer')
      }
    })
  })

  it('contains "Built by" text', () => {
    render(<Footer />)
    expect(screen.getByText(/Built by/i)).toBeInTheDocument()
  })

  it('renders desktop layout with full text', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Footer />)
    
    // Desktop layout should show full text
    expect(screen.getByText(/Built by/i)).toBeInTheDocument()
    expect(screen.getByText(/Luis Machado Reis/i)).toBeInTheDocument()
    expect(screen.getByText(/SingularIdeas/i)).toBeInTheDocument()
  })

  it('renders mobile layout with info button', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, // Mobile viewport
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Footer />)
    
    // Mobile layout should have info button
    const infoButton = screen.getByRole('button', { name: /View footer information/i })
    expect(infoButton).toBeInTheDocument()
  })

  it('opens modal when info button is clicked on mobile', async () => {
    const user = userEvent.setup()
    
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Footer />)
    
    const infoButton = screen.getByRole('button', { name: /View footer information/i })
    await user.click(infoButton)
    
    // Modal should open with title
    await waitFor(() => {
      expect(screen.getByText('About pudim.dev')).toBeInTheDocument()
    })
    
    // Modal should contain all footer information
    // Check for modal-specific content that only appears in modal
    expect(screen.getByText(/View on GitHub/i)).toBeInTheDocument()
    expect(screen.getByText(/Information about this project and its creators/i)).toBeInTheDocument()
    
    // Check for links within modal by href (more specific)
    const modalLuisLink = screen.getByRole('link', { name: /Luis Machado Reis/i })
    expect(modalLuisLink).toHaveAttribute('href', 'https://luismachadoreis.dev')
    
    const modalSingularLink = screen.getAllByRole('link').find(link => 
      link.textContent?.includes('SingularIdeas') && 
      link.getAttribute('href') === 'https://singularideas.com.br'
    )
    expect(modalSingularLink).toBeInTheDocument()
  })

  it('modal contains all links with correct attributes', async () => {
    const user = userEvent.setup()
    
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Footer />)
    
    const infoButton = screen.getByRole('button', { name: /View footer information/i })
    await user.click(infoButton)
    
    await waitFor(() => {
      expect(screen.getByText('About pudim.dev')).toBeInTheDocument()
    })
    
    // Check all links in modal
    const modalLinks = screen.getAllByRole('link')
    const luisLink = modalLinks.find(link => link.textContent?.includes('Luis Machado Reis'))
    const githubLink = modalLinks.find(link => link.textContent?.includes('GitHub'))
    const singularLink = modalLinks.find(link => link.textContent?.includes('SingularIdeas'))
    
    expect(luisLink).toHaveAttribute('href', 'https://luismachadoreis.dev')
    expect(githubLink).toHaveAttribute('href', 'https://github.com/luismr/pudim-dev-calculator')
    expect(singularLink).toHaveAttribute('href', 'https://singularideas.com.br')
  })

  it('mobile layout has GitHub icon link', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Footer />)
    
    const githubLink = screen.getByRole('link', { name: /View source code on GitHub/i })
    expect(githubLink).toBeInTheDocument()
    expect(githubLink).toHaveAttribute('href', 'https://github.com/luismr/pudim-dev-calculator')
  })

  it('mobile layout has SingularIdeas icon link', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<Footer />)
    
    const singularLink = screen.getByRole('link', { name: /Visit SingularIdeas/i })
    expect(singularLink).toBeInTheDocument()
    expect(singularLink).toHaveAttribute('href', 'https://singularideas.com.br')
  })
})

