import { describe, expect, it } from 'vitest'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ResolveRequest, ThemeOverride, ThemeState } from '@/models/theme.model'
import { createThemeRegistry, validateRegistry } from '@/registry/theme-registry'
import { deserializeTheme, serializeTheme } from '@/services/theme-serialization'

const registry = createThemeRegistry()
const expandedRegistry: FilamentRegistry = validateRegistry(registry.entries.map((entry) => entry.id === 'button.primary'
  ? {
      ...entry,
      controls: [
        ...entry.controls,
        { id: 'label', valueType: 'string' as const, defaultValue: 'Primary button' },
      ],
    }
  : entry))
const primaryScope: ResolveRequest = {
  targetId: 'button.primary',
  controlId: 'background',
  componentId: 'button',
  variantId: 'primary',
  stateId: 'hover',
}
const globalOverride: ThemeOverride = {
  targetId: 'button.primary',
  controlId: 'background',
  scope: 'global',
  value: '#334155',
}
const equalChildOverride: ThemeOverride = {
  targetId: 'button.primary',
  controlId: 'background',
  scope: 'component',
  componentId: 'button',
  value: '#334155',
}
const inheritedStateCopy: ThemeOverride = {
  ...equalChildOverride,
  scope: 'variant',
  variantId: 'primary',
}
const variantOverride: ThemeOverride = {
  targetId: 'button.primary',
  controlId: 'background',
  scope: 'variant',
  componentId: 'button',
  variantId: 'primary',
  value: '#4f46e5',
}
const themeWithGlobalAndEqualChild: ThemeState = {
  schemaVersion: 2,
  colors: { primary: '#6366f1' },
  overrides: [globalOverride, equalChildOverride],
}
const themeWithGlobalAndVariant: ThemeState = {
  schemaVersion: 2,
  colors: { primary: '#6366f1' },
  overrides: [globalOverride, variantOverride],
}
const expandedTheme: ThemeState = {
  schemaVersion: 2,
  colors: { primary: '#6366f1' },
  overrides: [globalOverride, variantOverride, {
    targetId: 'button.primary',
    controlId: 'label',
    scope: 'global',
    value: 'Configured button',
  }],
}
const invalidTheme: ThemeState = {
  ...themeWithGlobalAndVariant,
  overrides: [{ ...globalOverride, value: 'not-a-color' }],
}
const unresolvedRegistry: FilamentRegistry = validateRegistry(registry.entries.map((entry) => ({
  ...entry,
  controls: entry.controls.map(({ defaultValue: _defaultValue, ...control }) => control),
})))
const unresolvedTheme: ThemeState = {
  schemaVersion: 2,
  colors: { primary: '#6366f1' },
  overrides: [],
}

describe('theme serialization', () => {
  it('minimal serialization keeps only sparse explicit overrides', () => {
    const result = serializeTheme(themeWithGlobalAndEqualChild, registry, primaryScope, 'minimal')

    expect(result).toEqual(expect.objectContaining({ valid: true, mode: 'minimal' }))
    if (!result.valid) throw new Error(result.error)
    expect(result.state.overrides).toEqual(expect.arrayContaining([globalOverride, equalChildOverride]))
    expect(result.state.overrides).not.toContainEqual(inheritedStateCopy)
  })

  it('fully-explicit serialization materializes every supported control and scope', () => {
    const result = serializeTheme(expandedTheme, expandedRegistry, primaryScope, 'fully-explicit')

    expect(result).toEqual(expect.objectContaining({ valid: true, mode: 'fully-explicit' }))
    if (!result.valid) throw new Error(result.error)
    expect(result.state.overrides).toHaveLength(16)
    expect(result.state.overrides).toContainEqual(expect.objectContaining({ controlId: 'background', scope: 'global', value: '#334155' }))
    expect(result.state.overrides).toContainEqual(expect.objectContaining({ controlId: 'background', scope: 'component', value: '#334155' }))
    expect(result.state.overrides).toContainEqual(expect.objectContaining({ controlId: 'background', scope: 'variant', variantId: 'secondary', value: '#334155' }))
    expect(result.state.overrides).toContainEqual(expect.objectContaining({ scope: 'state', value: '#4f46e5' }))
    expect(result.state.overrides).toContainEqual(expect.objectContaining({ controlId: 'label', scope: 'global', value: 'Configured button' }))
    expect(result.state.overrides).toContainEqual(expect.objectContaining({ controlId: 'label', scope: 'state', variantId: 'secondary', stateId: 'default', value: 'Configured button' }))
    expect(result.state.overrides).not.toContainEqual(expect.objectContaining({ value: undefined }))
  })

  it('rejects invalid or unresolved export values instead of emitting them', () => {
    expect(serializeTheme(invalidTheme, registry, primaryScope, 'minimal')).toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
    expect(serializeTheme(unresolvedTheme, unresolvedRegistry, primaryScope, 'fully-explicit')).toMatchObject({ valid: false, error: expect.stringMatching(/unresolved/i) })
  })

  it('round-trips the current domain representation without copying inherited values', () => {
    const serialized = serializeTheme(themeWithGlobalAndVariant, registry, primaryScope, 'minimal')
    if (!serialized.valid) throw new Error(serialized.error)

    expect(deserializeTheme(JSON.stringify(serialized.state), registry)).toEqual({ valid: true, state: serialized.state })
  })

  it('rejects malformed runtime input before state validation', () => {
    expect(deserializeTheme('{"schemaVersion":2,"colors":null,"overrides":[]}', registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
    expect(deserializeTheme('[]', registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
    expect(deserializeTheme('{not-json', registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
  })
})
