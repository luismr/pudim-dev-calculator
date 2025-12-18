'use client'

/**
 * Logger utility that respects FRONTEND_DEBUG_ENABLED environment variable
 * Only logs when FRONTEND_DEBUG_ENABLED is true
 */

// Store the debug flag in a way that can be accessed synchronously
// This will be set by the EnvProvider when it loads
let debugEnabled = false

/**
 * Set the debug enabled flag (called by EnvProvider)
 */
export function setDebugEnabled(enabled: boolean) {
  debugEnabled = enabled
}

/**
 * Get the current debug enabled state
 */
export function isDebugEnabled(): boolean {
  return debugEnabled
}

/**
 * Log wrapper that only logs when FRONTEND_DEBUG_ENABLED is true
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (debugEnabled) {
      console.log(...args)
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, regardless of debug flag
    console.error(...args)
  },
  warn: (...args: unknown[]) => {
    // Always log warnings, regardless of debug flag
    console.warn(...args)
  },
  info: (...args: unknown[]) => {
    if (debugEnabled) {
      console.info(...args)
    }
  },
  debug: (...args: unknown[]) => {
    if (debugEnabled) {
      console.debug(...args)
    }
  },
}

