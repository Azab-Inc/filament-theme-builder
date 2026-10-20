import { afterEach, describe, expect, it, vi } from 'vitest'

const families = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe']
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

async function loadPaletteWithSnapshot(suppliedValues: Record<string, string[]>, suppliedShades = shades) {
  vi.resetModules()
  vi.doMock('@/registry/tailwind-palette-snapshot', () => ({
    TAILWIND_PALETTE_FAMILIES: families,
    TAILWIND_PALETTE_SHADES: suppliedShades,
    TAILWIND_PALETTE_HEX: suppliedValues,
  }))
  return import('@/utils/tailwind-palette')
}

afterEach(() => vi.doUnmock('@/registry/tailwind-palette-snapshot'))

describe('Tailwind palette fail-closed public API', () => {
  it('returns no choices when a bundled hex value is malformed', async () => {
    const values = Object.fromEntries(families.map((family) => [family, shades.map(() => '#112233')]))
    values.red![0] = 'invalid hex'
    const palette = await loadPaletteWithSnapshot(values)

    expect(palette.getTailwindColors()).toEqual([])
    expect(Object.isFrozen(palette.getTailwindColors())).toBe(true)
    expect(palette.searchTailwindColors('red')).toEqual([])
    expect(Object.isFrozen(palette.searchTailwindColors('red'))).toBe(true)
    expect(palette.findTailwindColor('red-500')).toBeUndefined()
  })

  it('returns no choices when a bundled shade stop is missing', async () => {
    const values = Object.fromEntries(families.map((family) => [family, shades.map(() => '#112233')]))
    const palette = await loadPaletteWithSnapshot(values, shades.slice(1))

    expect(palette.getTailwindColors()).toEqual([])
    expect(palette.searchTailwindColors('')).toEqual([])
    expect(palette.findTailwindColor('#777777')).toBeUndefined()
  })
})
