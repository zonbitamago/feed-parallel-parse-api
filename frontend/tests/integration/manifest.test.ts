import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

describe('Web App Manifest', () => {
  // manifest.jsonを直接読み込む
  const manifestPath = resolve(__dirname, '../../public/manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  it('should have icons array defined', () => {
    expect(manifest.icons).toBeDefined()
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  it('should have correct icon definitions', () => {
    const icons = manifest.icons

    // 192x192アイコンの確認
    const icon192 = icons.find((icon: { sizes: string }) => icon.sizes === '192x192')
    expect(icon192).toBeDefined()
    expect(icon192.src).toContain('icon-192x192.png')
    expect(icon192.type).toBe('image/png')
    expect(icon192.purpose).toContain('any')
    expect(icon192.purpose).toContain('maskable')

    // 512x512アイコンの確認
    const icon512 = icons.find((icon: { sizes: string }) => icon.sizes === '512x512')
    expect(icon512).toBeDefined()
    expect(icon512.src).toContain('icon-512x512.png')
    expect(icon512.type).toBe('image/png')
    expect(icon512.purpose).toContain('any')
    expect(icon512.purpose).toContain('maskable')
  })

  it('should have purpose field for PWA icons', () => {
    const icons = manifest.icons

    // PWAアイコン（192x192と512x512）はpurposeが必須
    const pwaIcons = icons.filter((icon: { sizes: string }) =>
      icon.sizes === '192x192' || icon.sizes === '512x512'
    )

    pwaIcons.forEach((icon: { purpose?: string; sizes: string }) => {
      expect(icon.purpose).toBeDefined()
      expect(typeof icon.purpose).toBe('string')
      expect(icon.purpose.length).toBeGreaterThan(0)
    })
  })

  it('should have valid theme and background colors', () => {
    expect(manifest.theme_color).toBeDefined()
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i)

    expect(manifest.background_color).toBeDefined()
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('should have icon files exist', () => {
    const icons = manifest.icons
    const publicDir = resolve(__dirname, '../../public')

    icons.forEach((icon: { src: string; sizes: string }) => {
      const iconPath = resolve(publicDir, icon.src.replace(/^\//, ''))
      expect(existsSync(iconPath)).toBe(true)
    })
  })
})
