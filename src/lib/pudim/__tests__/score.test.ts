import { describe, it, expect } from 'vitest'
import { calculatePudimScore } from '../score'
import type { GitHubStats } from '../types'

const createMockStats = (
  overrides: Partial<GitHubStats>
): GitHubStats => ({
  username: 'testuser',
  avatar_url: 'https://example.com/avatar.jpg',
  followers: 0,
  total_stars: 0,
  public_repos: 0,
  created_at: '2012-01-01T00:00:00Z',
  languages: [],
  ...overrides,
})

describe('calculatePudimScore', () => {
  it('calculates S+ rank for score > 1000', () => {
    const stats = createMockStats({
      followers: 100,
      total_stars: 500, // 500 * 2 = 1000
      public_repos: 50, // 50 * 1 = 50
      // Total: 100 * 0.5 + 1000 + 50 = 1100
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(1100)
    expect(result.rank.rank).toBe('S+')
    expect(result.rank.title).toBe('Legendary Flan')
    expect(result.rank.emoji).toBe('🍮✨')
  })

  it('calculates S rank for score > 500 and <= 1000', () => {
    const stats = createMockStats({
      followers: 50,
      total_stars: 250, // 250 * 2 = 500
      public_repos: 25, // 25 * 1 = 25
      // Total: 50 * 0.5 + 500 + 25 = 550
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(550)
    expect(result.rank.rank).toBe('S')
    expect(result.rank.title).toBe('Master Pudim')
  })

  it('calculates A rank for score > 200 and <= 500', () => {
    const stats = createMockStats({
      followers: 50,
      total_stars: 100, // 100 * 2 = 200
      public_repos: 25, // 25 * 1 = 25
      // Total: 50 * 0.5 + 200 + 25 = 250
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(250)
    expect(result.rank.rank).toBe('A')
    expect(result.rank.title).toBe('Tasty Pudding')
  })

  it('calculates B rank for score > 100 and <= 200', () => {
    const stats = createMockStats({
      followers: 50,
      total_stars: 50, // 50 * 2 = 100
      public_repos: 25, // 25 * 1 = 25
      // Total: 50 * 0.5 + 100 + 25 = 150
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(150)
    expect(result.rank.rank).toBe('B')
    expect(result.rank.title).toBe('Sweet Treat')
  })

  it('calculates C rank for score > 50 and <= 100', () => {
    const stats = createMockStats({
      followers: 30,
      total_stars: 30, // 30 * 2 = 60
      public_repos: 15, // 15 * 1 = 15
      // Total: 30 * 0.5 + 60 + 15 = 90
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(90)
    expect(result.rank.rank).toBe('C')
    expect(result.rank.title).toBe('Homemade')
  })

  it('calculates D rank for score <= 50', () => {
    const stats = createMockStats({
      followers: 20,
      total_stars: 10, // 10 * 2 = 20
      public_repos: 10, // 10 * 1 = 10
      // Total: 20 * 0.5 + 20 + 10 = 40
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(40)
    expect(result.rank.rank).toBe('D')
    expect(result.rank.title).toBe('Underbaked')
  })

  it('handles edge case at exactly 1000 score (S+ rank)', () => {
    const stats = createMockStats({
      followers: 0,
      total_stars: 500, // 500 * 2 = 1000
      public_repos: 0,
      // Total: 1000
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(1000)
    // Score > 1000 is false, so it should be S rank
    expect(result.rank.rank).toBe('S')
  })

  it('handles edge case at exactly 500 score (S rank)', () => {
    const stats = createMockStats({
      followers: 0,
      total_stars: 250, // 250 * 2 = 500
      public_repos: 0,
      // Total: 500
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(500)
    // Score > 500 is false, so it should be A rank
    expect(result.rank.rank).toBe('A')
  })

  it('handles edge case at exactly 200 score (A rank)', () => {
    const stats = createMockStats({
      followers: 0,
      total_stars: 100, // 100 * 2 = 200
      public_repos: 0,
      // Total: 200
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(200)
    // Score > 200 is false, so it should be B rank
    expect(result.rank.rank).toBe('B')
  })

  it('handles edge case at exactly 100 score (B rank)', () => {
    const stats = createMockStats({
      followers: 0,
      total_stars: 50, // 50 * 2 = 100
      public_repos: 0,
      // Total: 100
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(100)
    // Score > 100 is false, so it should be C rank
    expect(result.rank.rank).toBe('C')
  })

  it('handles edge case at exactly 50 score (C rank)', () => {
    const stats = createMockStats({
      followers: 0,
      total_stars: 25, // 25 * 2 = 50
      public_repos: 0,
      // Total: 50
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(50)
    // Score > 50 is false, so it should be D rank
    expect(result.rank.rank).toBe('D')
  })

  it('handles zero score (D rank)', () => {
    const stats = createMockStats({
      followers: 0,
      total_stars: 0,
      public_repos: 0,
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(0)
    expect(result.rank.rank).toBe('D')
  })

  it('calculates score formula correctly', () => {
    const stats = createMockStats({
      followers: 100, // 100 * 0.5 = 50
      total_stars: 200, // 200 * 2 = 400
      public_repos: 50, // 50 * 1 = 50
      // Expected: 50 + 400 + 50 = 500
    })

    const result = calculatePudimScore(stats)

    expect(result.score).toBe(500)
  })
})

