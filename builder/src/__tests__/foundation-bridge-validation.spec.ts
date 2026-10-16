import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { PALETTE_NAMES, PALETTE_SHADES, type FoundationState } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'

describe('foundation preview bridge validation', () => {
  it('keeps the bridge explicit-path allowlist in parity with the TypeScript validator', () => {
    const bridge = readFileSync(resolve(process.cwd(), '../demo/resources/views/filament/preview-bridge.blade.php'), 'utf8')
    const bridgeAllowlist = bridge.match(/const isSafeExplicitPath = \(path\) => (\/.*\/\.test\(path\));/)?.[1]
    expect(bridgeAllowlist).toBeDefined()
    const isBridgePathAllowed = new Function('path', `return ${bridgeAllowlist}`) as (path: string) => boolean
    const state: FoundationState = createDefaultFoundationState()
    const allowedPaths = [
      ...PALETTE_NAMES.flatMap((name) => [`palettes.${name}.base`, ...PALETTE_SHADES.map((shade) => `palettes.${name}.overrides.${shade}`)]),
      ...['surfaces.page', 'surfaces.sidebar', 'surfaces.topbar', 'surfaces.card', 'surfaces.elevated', 'surfaces.input', 'borders.default', 'borders.strong', 'text.primary', 'text.muted', 'text.disabled'].flatMap((path) => [`${path}.light`, `${path}.dark`]),
      ...['body', 'heading', 'mono'].map((name) => `typography.${name}`),
      ...Object.keys(state.spacing).map((key) => `spacing.${key}`),
      'density', 'radius', 'borderWidth', 'shadow',
    ]
    const paths = [...allowedPaths, 'palettes.primary.overrides.49', 'spacing.9', 'untrusted.path']

    for (const path of paths) {
      expect(isBridgePathAllowed(path), `bridge allowlist for ${path}`).toBe(allowedPaths.includes(path))
    }
  })
})
