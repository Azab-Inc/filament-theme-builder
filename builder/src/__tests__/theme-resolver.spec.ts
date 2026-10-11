import { describe, expect, it } from 'vitest'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ResolveRequest, ThemeOverride, ThemeState } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { resolveThemeValue } from '@/services/theme-resolver'
import { validateThemeOverride, validateThemeState } from '@/services/theme-validation'

const registry: FilamentRegistry = createThemeRegistry()
const requestFor = (variantId?: string, stateId?: string): ResolveRequest => ({ targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId, stateId })
const global = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'global', value })
const component = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'component', componentId: 'button', value })
const variant = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'variant', componentId: 'button', variantId: 'primary', value })
const stateValue = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'state', componentId: 'button', variantId: 'primary', stateId: 'hover', value })
const withOverrides = (...overrides: ThemeOverride[]): ThemeState => ({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides })
const emptyTheme = withOverrides()
const requestWithDefault = requestFor('primary')
const requestWithoutDefault = { ...requestWithDefault, controlId: 'border' }
const componentRequest = requestFor('primary')

const unknownTarget: ThemeOverride = { ...global('#334155'), targetId: 'button.unknown' }
const unsupportedState: ThemeOverride = { ...stateValue('#4338ca'), stateId: 'focus' }
const invalidColor: ThemeOverride = { ...global('not-a-color') }
const invalidExternalTheme: ThemeState = withOverrides(invalidColor)

describe('theme validation and resolution', () => {
  it('resolves Global → Component → Variant → State and nearest parent fallback', () => {
    const state = withOverrides(global('#334155'), component('#475569'), variant('#4f46e5'), stateValue('#4338ca'))

    expect(resolveThemeValue(state, registry, { ...requestFor('default'), componentId: 'other' })).toMatchObject({ status: 'resolved', value: '#334155', source: 'global' })
    expect(resolveThemeValue(state, registry, requestFor('secondary'))).toMatchObject({ value: '#475569', source: 'component' })
    expect(resolveThemeValue(state, registry, requestFor('primary', 'focus'))).toMatchObject({ value: '#4f46e5', source: 'variant' })
    expect(resolveThemeValue(state, registry, requestFor('primary', 'hover'))).toMatchObject({ value: '#4338ca', source: 'state' })
  })

  it('returns registry defaults and unresolved results without inventing values', () => {
    expect(resolveThemeValue(emptyTheme, registry, requestWithDefault)).toEqual({ status: 'resolved', value: '#6366f1', source: 'registry-default' })
    expect(resolveThemeValue(emptyTheme, registry, requestWithoutDefault)).toEqual({ status: 'unresolved', targetId: 'button.primary', controlId: 'border' })
  })

  it('rejects unknown IDs, controls, unsupported keys, invalid values, and incompatible baselines', () => {
    expect(validateThemeOverride(unknownTarget, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unknown target/i) })
    expect(validateThemeOverride({ ...unknownTarget, targetId: 'button.primary', controlId: 'border' }, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unknown control/i) })
    expect(validateThemeOverride(unsupportedState, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*state/i) })
    expect(validateThemeOverride(invalidColor, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid value/i) })
    expect(validateThemeOverride({ ...global('#334155'), scope: 'component' }, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/component/i) })
    expect(validateThemeOverride({ ...global('#334155'), scope: 'invalid' } as unknown as ThemeOverride, registry)).toMatchObject({ valid: false, targetId: 'button.primary', controlId: 'background', scope: 'invalid', error: expect.stringMatching(/invalid.*scope/i) })
    expect(validateThemeOverride({ ...global('#334155'), unexpected: true } as ThemeOverride, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*key/i) })
    expect(validateThemeOverride({ ...global('#334155'), componentId: 42 } as unknown as ThemeOverride, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/component.*string|identifier/i) })
  })

  it('rejects unsupported or mismatched registry compatibility baselines', () => {
    const mismatchedRegistry = {
      entries: registry.entries.map((entry, index) => index === 0 ? { ...entry, filamentCompatibility: '4.x' } : entry),
    } as FilamentRegistry

    expect(validateThemeOverride(global('#334155'), mismatchedRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/compatibility.*baseline/i) })
    expect(validateThemeOverride(global('#334155'), { entries: [{ ...registry.entries[0], filamentCompatibility: 'future' }] } as FilamentRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/compatibility.*baseline/i) })
  })

  it('uses a valid legacy primary value before the registry default', () => {
    const legacyState: ThemeState = { schemaVersion: 1, colors: { primary: '#123456' } }

    expect(resolveThemeValue(legacyState, registry, { targetId: 'global.primary', controlId: 'primary' })).toEqual({ status: 'resolved', value: '#123456', source: 'legacy-global' })
  })

  it('preserves explicit equal-to-parent values as explicit', () => {
    const state = withOverrides(global('#334155'), component('#334155'))

    expect(resolveThemeValue(state, registry, componentRequest)).toMatchObject({ value: '#334155', source: 'component' })
  })

  it('does not throw while resolving a quarantined invalid external override', () => {
    expect(() => resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).not.toThrow()
    expect(resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).toEqual({ status: 'resolved', value: '#6366f1', source: 'registry-default' })
    expect(validateThemeState(invalidExternalTheme, registry)).toMatchObject({ valid: false, invalidOverrides: [{ targetId: 'button.primary', controlId: 'background', scope: 'global', error: expect.stringMatching(/invalid value/i) }] })
  })

  it('does not mutate state while resolving inherited values', () => {
    const state = withOverrides(global('#334155'), variant('#4f46e5'))
    const before = structuredClone(state)

    resolveThemeValue(state, registry, requestFor('primary'))

    expect(state).toEqual(before)
  })
})
