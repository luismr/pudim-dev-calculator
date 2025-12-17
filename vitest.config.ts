import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    threads: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'cobertura'],
      exclude: [
        'src/test/*',
        'src/app/_server/__tests__/*',
        'src/app/api/*',
        'src/app/badge/*',
        'src/app/calculator/[username]/metadata.test.ts',
        'src/components/ui/*',
        'src/lib/pudim/types.ts',
        'src/lib/pudim/index.ts',
      ],
    },
  },
})