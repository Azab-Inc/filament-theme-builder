import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  FILAMENT_FOUNDATION_INVENTORY,
  lookupFoundationMapping,
} from '@/registry/filament-foundation-inventory'
import {
  TAILWIND_COLOR_FAMILIES,
  TAILWIND_COLOR_SHADES,
  resolveTrustedColorReference,
} from '@/registry/tailwind-color-catalog'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('Filament foundation inventory catalog', () => {
  it('resolves standard Tailwind references to installed literals without changing canonical references', () => {
    expect(resolveTrustedColorReference('var(--red-200)')).toBe('oklch(88.5% 0.062 18.334)')
    expect(resolveTrustedColorReference('var(--color-red-200)')).toBe('oklch(88.5% 0.062 18.334)')
    expect(resolveTrustedColorReference('var(--gray-200)')).toBe('var(--gray-200)')
    expect(resolveTrustedColorReference('var(--slate-200)')).toBe('oklch(92.9% 0.013 255.508)')
    expect(resolveTrustedColorReference('var(--primary-200)')).toBe('var(--primary-200)')
  })

  it('keeps the bridge Tailwind color catalog in parity with the trusted builder catalog', () => {
    const bridge = readFileSync(resolve(repositoryRoot, 'demo/resources/views/filament/preview-bridge.blade.php'), 'utf8')
    const families = bridge.match(/const tailwindColorFamilies = (\[[^;]+\]);/)?.[1]
    const shades = bridge.match(/const tailwindColorShades = (\[[^;]+\]);/)?.[1]

    expect(families).toBeDefined()
    expect(shades).toBeDefined()
    expect(JSON.parse(families!.replace(/'/g, '"'))).toEqual(TAILWIND_COLOR_FAMILIES)
    expect(JSON.parse(shades!)).toEqual(TAILWIND_COLOR_SHADES)
  })

  it('matches every trusted literal to the installed Tailwind theme source', () => {
    const themeSource = readFileSync(resolve(repositoryRoot, 'demo/node_modules/tailwindcss/theme.css'), 'utf8')

    for (const [, family, shade, value] of themeSource.matchAll(/--color-([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950):\s*([^;]+);/g)) {
      expect(resolveTrustedColorReference(`var(--color-${family}-${shade})`)).toBe(value!.trim())
    }
  })

  it('classifies every FTB-005 control exactly once', () => {
    const expected = [
      ...['primary', 'success', 'warning', 'danger', 'info', 'gray'].flatMap((palette) => [
        `palette.${palette}.base`,
        ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => `palette.${palette}.shades.${shade}`),
      ]),
      ...['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'].map((name) => `surface.${name}`),
      ...['default', 'strong'].map((name) => `border.${name}`),
      ...['primary', 'muted', 'disabled'].map((name) => `text.${name}`),
      'typography.body', 'typography.heading', 'typography.mono',
      ...['0', 'px', '0.5', '1', '1.5', '2', '3', '4', '6', '8'].map((key) => `spacing.${key}`),
      'density', 'radius', 'borderWidth', 'shadow',
    ]

    for (const id of expected) expect(lookupFoundationMapping(id)).toBeDefined()
    expect(new Set(expected.map((id) => lookupFoundationMapping(id)?.id)).size).toBe(expected.length)
  })
})
