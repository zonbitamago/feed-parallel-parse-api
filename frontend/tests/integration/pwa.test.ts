import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

describe('PWA Integration', () => {
  it('should have manifest.json accessible', () => {
    // manifest.jsonの存在を確認（CI環境対応のためfsを使用）
    const manifestPath = resolve(__dirname, '../../public/manifest.json')
    expect(existsSync(manifestPath)).toBe(true)

    const manifestContent = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)
    expect(manifest.name).toBeDefined()
    expect(manifest.short_name).toBeDefined()
    expect(manifest.start_url).toBeDefined()
    expect(manifest.display).toBeDefined()
  })

  it('should register service worker', async () => {
    // このテストは失敗する（Red）- registerSWがまだ実装されていない
    if ('serviceWorker' in navigator) {
      const { registerSW } = await import('../../src/registerSW')
      const registration = await registerSW()

      expect(registration).toBeDefined()
    }
  })
})
