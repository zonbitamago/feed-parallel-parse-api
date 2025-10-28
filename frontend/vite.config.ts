import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    // テスト完了後にプロセスを確実に終了させる設定
    // Vitest v4では、run モードがデフォルトでプロセスを終了するため、
    // 追加の設定は不要。package.jsonの "vitest run" で対応済み。
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.tsx',
        '**/*.test.ts',
        'tests/',
        'vite.config.ts',
        'postcss.config.js',
        'tailwind.config.js',
      ],
    },
  },
})
