import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navbar } from '../Navbar'

describe('Navbar - Mobile Menu', () => {
  it('renders mobile menu trigger button', () => {
    render(<Navbar />)
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('opens mobile menu when hamburger is clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await user.click(menuButton)
    
    await waitFor(() => {
      const featuresLinks = screen.getAllByText('Features')
      expect(featuresLinks.length).toBeGreaterThan(1) // Desktop + Mobile
    })
  })

  it('shows pudim.dev branding in mobile menu', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await user.click(menuButton)
    
    await waitFor(() => {
      const headings = screen.getAllByText('pudim.dev')
      expect(headings.length).toBeGreaterThan(1) // Header logo + menu header
    })
  })

  it('closes menu when navigation link is clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await user.click(menuButton)
    
    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument()
    })
    
    // Click a link
    const featuresLink = screen.getByRole('link', { name: 'Features' })
    await user.click(featuresLink)
    
    // Menu should close (links should not be visible anymore)
    await waitFor(() => {
      const links = screen.queryAllByRole('link', { name: 'Features' })
      // Should only see the main navbar, not the mobile menu version
      expect(links.length).toBeLessThanOrEqual(1)
    })
  })

  it('contains all navigation links in mobile menu', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await user.click(menuButton)
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '/#features')
      expect(screen.getByRole('link', { name: 'Algorithm' })).toHaveAttribute('href', '/#algorithm')
      expect(screen.getByRole('link', { name: 'Ranking' })).toHaveAttribute('href', '/#ranking')
      expect(screen.getByRole('link', { name: 'Philosophy' })).toHaveAttribute('href', '/#philosophy')
    })
  })
})

