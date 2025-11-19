import { describe, it, expect } from 'vitest'
import { generateMetadata } from '../page'

describe('Calculator Page - Metadata Generation', () => {
  it('generates metadata with username in title', async () => {
    const params = Promise.resolve({ username: 'testuser' })
    const metadata = await generateMetadata({ params })
    
    expect(metadata.title).toContain('testuser')
    expect(metadata.title).toContain('pudim.dev')
    expect(metadata.title).toContain('🍮')
  })

  it('generates metadata with proper description', async () => {
    const params = Promise.resolve({ username: 'testuser' })
    const metadata = await generateMetadata({ params })
    
    expect(metadata.description).toContain('testuser')
    expect(metadata.description).toContain('Dev Pudim Score')
  })

  it('includes Open Graph metadata', async () => {
    const params = Promise.resolve({ username: 'testuser' })
    const metadata = await generateMetadata({ params })
    
    expect(metadata.openGraph).toBeDefined()
    expect(metadata.openGraph?.title).toContain('testuser')
    expect(metadata.openGraph?.url).toContain('/calculator/testuser')
    expect(metadata.openGraph?.siteName).toBe('pudim.dev')
  })

  it('includes badge image in Open Graph', async () => {
    const params = Promise.resolve({ username: 'testuser' })
    const metadata = await generateMetadata({ params })
    
    expect(metadata.openGraph?.images).toBeDefined()
    const images = metadata.openGraph?.images as Array<{ url: string }>
    expect(images[0].url).toContain('/badge/testuser')
  })

  it('includes Twitter Card metadata', async () => {
    const params = Promise.resolve({ username: 'testuser' })
    const metadata = await generateMetadata({ params })
    
    expect(metadata.twitter).toBeDefined()
    expect(metadata.twitter?.card).toBe('summary_large_image')
    expect(metadata.twitter?.title).toContain('testuser')
  })

  it('handles URL-encoded usernames', async () => {
    const params = Promise.resolve({ username: 'test%20user' })
    const metadata = await generateMetadata({ params })
    
    expect(metadata.title).toContain('test user')
    expect(metadata.description).toContain('test user')
  })

  it('includes badge URL with encoded username', async () => {
    const params = Promise.resolve({ username: 'user@test' })
    const metadata = await generateMetadata({ params })
    
    const images = metadata.openGraph?.images as Array<{ url: string }>
    expect(images[0].url).toContain('/badge/')
    expect(images[0].url).toContain('user%40test')
  })
})

