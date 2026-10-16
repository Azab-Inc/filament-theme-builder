import { describe, expect, it } from 'vitest'

import { serializeTheme } from '@/utils/theme-serialization'
import {
  equalChildOverride,
  expandedRegistry,
  expandedTheme,
  inheritedStateCopy,
  invalidTheme,
  primaryScope,
  registry,
  unresolvedRegistry,
  unresolvedTheme,
  themeWithGlobalAndEqualChild,
} from './theme-serialization.fixtures'

describe('theme export serialization', () => {
  it('minimal serialization keeps only sparse explicit overrides', () => {
    const result = serializeTheme(themeWithGlobalAndEqualChild, registry, primaryScope, 'minimal')
    expect(result).toEqual(expect.objectContaining({ valid: true, mode: 'minimal' }))
    if (!result.valid) throw new Error(result.error)
    expect(result.state.overrides).toEqual(expect.arrayContaining([
      { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#334155' }, equalChildOverride,
    ]))
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
    expect(serializeTheme(invalidTheme, registry, primaryScope, 'minimal'))
      .toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
    expect(serializeTheme(unresolvedTheme, unresolvedRegistry, primaryScope, 'fully-explicit'))
      .toMatchObject({ valid: false, error: expect.stringMatching(/unresolved/i) })
  })
})
