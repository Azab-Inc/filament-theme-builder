import { afterEach, describe, expect, it, vi } from 'vitest'

const families = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe']
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

async function loadPaletteWithSource(resolveSource: () => string, suppliedShades = shades) {
  vi.resetModules()
  vi.doMock('@/registry/tailwind-color-catalog', () => ({
    TAILWIND_COLOR_FAMILIES: families,
    TAILWIND_COLOR_SHADES: suppliedShades,
    resolveTrustedColorReference: resolveSource,
  }))
  return import('@/utils/tailwind-palette')
}

afterEach(() => vi.doUnmock('@/registry/tailwind-color-catalog'))

describe('Tailwind palette fail-closed public API', () => {
  it('returns no choices when a bundled source color is malformed', async () => {
    const palette = await loadPaletteWithSource(() => 'invalid color source')

    expect(palette.getTailwindColors()).toEqual([])
    expect(Object.isFrozen(palette.getTailwindColors())).toBe(true)
    expect(palette.searchTailwindColors('red')).toEqual([])
    expect(Object.isFrozen(palette.searchTailwindColors('red'))).toBe(true)
    expect(palette.findTailwindColor('red-500')).toBeUndefined()
  })

  it('returns no choices when a bundled shade stop is missing', async () => {
    const palette = await loadPaletteWithSource(() => 'oklch(50% 0.1 20)', shades.slice(1))

    expect(palette.getTailwindColors()).toEqual([])
    expect(palette.searchTailwindColors('')).toEqual([])
    expect(palette.findTailwindColor('#777777')).toBeUndefined()
  })
})
