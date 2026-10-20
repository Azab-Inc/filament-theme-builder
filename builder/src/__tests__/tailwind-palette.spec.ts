import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getTailwindColors, searchTailwindColors, findTailwindColor, tailwindPaletteMetadata } from '@/utils/tailwind-palette'
import { isValidTailwindSnapshot } from '@/utils/tailwind-palette-validation'

const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const source = readFileSync(resolve(import.meta.dirname, '../../../demo/node_modules/tailwindcss/theme.css'), 'utf8')

function convertSourceValue(value: string): string {
  const match = /^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+|none)\)$/.exec(value)
  if (!match) throw new Error(`Unexpected source color: ${value}`)
  const [, light, chroma, hue] = match
  const l = Number(light) / 100, c = Number(chroma), h = hue === 'none' ? 0 : Number(hue)
  const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180)
  const L = (l + .3963377774 * a + .2158037573 * b) ** 3
  const M = (l - .1055613458 * a - .0638541728 * b) ** 3
  const S = (l - .0894841775 * a - 1.291485548 * b) ** 3
  const channels = [4.0767416621 * L - 3.3077115913 * M + .2309699292 * S, -1.2684380046 * L + 2.6097574011 * M - .3413193965 * S, -.0041960863 * L - .7034186147 * M + 1.707614701 * S]
  return `#${channels.map((v) => Math.round(Math.max(0, Math.min(1, v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055)) * 255).toString(16).padStart(2, '0')).join('')}`
}

describe('pinned Tailwind palette snapshot', () => {
  it('contains 26 complete unique families in deterministic order', () => {
    const colors = getTailwindColors()
    expect(colors).toHaveLength(286)
    expect(new Set(colors.map(({ family }) => family)).size).toBe(26)
    expect(new Set(colors.map(({ name }) => name)).size).toBe(286)
    expect(colors.map(({ name }) => name)).toEqual(getTailwindColors().map(({ name }) => name))
    for (const family of new Set(colors.map(({ family }) => family))) {
      expect(colors.filter((color) => color.family === family).map(({ shade }) => shade)).toEqual(shades)
    }
  })

  it('pins source and license metadata and representative normalized values', () => {
    expect(tailwindPaletteMetadata).toMatchObject({ version: '4.3.3', snapshotDate: '2026-10-20', license: 'MIT' })
    expect(tailwindPaletteMetadata.sourceUrl).toContain('github.com/tailwindlabs/tailwindcss')
    expect(tailwindPaletteMetadata.licenseNotice).toContain('Copyright (c) Tailwind Labs, Inc.')
    expect(tailwindPaletteMetadata.transformation).toContain('OKLCH to OKLab to linear sRGB to sRGB transfer')
    expect(findTailwindColor('gray-900')).toMatchObject({ value: '#101828', sourceValue: 'oklch(21% 0.034 264.665)' })
    expect(findTailwindColor('red-500')).toMatchObject({ value: '#fb2c36', sourceValue: 'oklch(63.7% 0.237 25.331)' })
    expect(findTailwindColor('neutral-50')).toMatchObject({ value: '#fafafa', sourceValue: 'oklch(98.5% 0 none)' })
  })

  it('matches every installed source OKLCH token after deterministic conversion', () => {
    const entries = [...source.matchAll(/--color-([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950):\s*(oklch\([^;]+\));/g)]
    expect(entries.length).toBe(286)
    expect(getTailwindColors().map(({ name, sourceValue }) => `${name}:${sourceValue}`).sort()).toEqual(
      entries.map(([, family, shade, value]) => `${family}-${shade}:${value}`).sort(),
    )
    expect(getTailwindColors().every(({ sourceValue, value }) => convertSourceValue(sourceValue) === value)).toBe(true)
    expect(getTailwindColors().every(({ value }) => /^#[0-9a-f]{6}$/.test(value))).toBe(true)
    expect(findTailwindColor('#FB2C36')?.name).toBe('red-500')
  })

  it('searches family, shade, and token case/space-insensitively with recovery', () => {
    expect(searchTailwindColors('GRAY-900').map(({ name }) => name)).toEqual(['gray-900'])
    expect(searchTailwindColors(' blue ').map(({ name }) => name)).toHaveLength(11)
    expect(searchTailwindColors(' 500 ').map(({ name }) => name)).toHaveLength(26)
    expect(searchTailwindColors('not-a-color')).toEqual([])
    expect(searchTailwindColors('').map(({ name }) => name)).toEqual(getTailwindColors().map(({ name }) => name))
  })

  it('keeps the shared snapshot deeply immutable', () => {
    expect(Object.isFrozen(getTailwindColors())).toBe(true)
    expect(getTailwindColors().every(Object.isFrozen)).toBe(true)
  })

  it('rejects malformed, duplicate, and incomplete snapshots for choice APIs', () => {
    const colors = getTailwindColors()
    const first = colors[0]!
    const families = [...new Set(colors.map(({ family }) => family))]
    expect(isValidTailwindSnapshot(colors, families)).toBe(true)
    expect(isValidTailwindSnapshot([...colors, first], families)).toBe(false)
    expect(isValidTailwindSnapshot(colors.slice(1), families)).toBe(false)
    expect(isValidTailwindSnapshot(colors.map((color, index) => index === 0 ? { ...color, value: 'not-hex' } : color), families)).toBe(false)
    expect(getTailwindColors()).toHaveLength(286)
    expect(searchTailwindColors('')).toHaveLength(286)
    expect(findTailwindColor('not-a-color')).toBeUndefined()
  })
})
