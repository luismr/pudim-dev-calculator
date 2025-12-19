import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import React, { ReactElement } from 'react'
import { LeaderboardRefreshProvider } from '@/contexts/LeaderboardRefreshContext'
import { EnvProvider } from '@/contexts/EnvContext'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the env API route for tests
global.fetch = vi.fn()

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(_callback: ResizeObserverCallback) {
    // Callback is stored but not used in mock
    void _callback
  }
} as unknown as typeof ResizeObserver

// Mock Recharts ResponsiveContainer
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>()
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      React.createElement('div', { style: { width: 800, height: 800 } }, children)
    ),
  }
})

// Test wrapper with all providers
export function TestWrapper({ children }: { children: ReactElement }) {
  // Mock env values for tests
  const mockEnv = {
    REDIS_ENABLED: false,
    DYNAMODB_ENABLED: false,
    LEADERBOARD_ENABLED: false,
    IS_LEADERBOARD_VISIBLE: false,
    FRONTEND_DEBUG_ENABLED: false,
  }

  // Mock fetch for EnvProvider
  if (global.fetch) {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnv,
    } as Response)
  }

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
