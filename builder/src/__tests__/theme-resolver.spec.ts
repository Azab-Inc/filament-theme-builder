import { describe, expect, it } from 'vitest'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeOverride, ThemeState } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { resolveThemeValue } from '@/services/theme-resolver'
import { validateThemeOverride, validateThemeState } from '@/services/theme-validation'

type ResolveRequest = {
  targetId: string
  controlId: string
  componentId?: string
  variantId?: string
  stateId?: string
}

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
    const state = withOverrides(global('#334155'), variant('#4f46e5'), stateValue('#4338ca'))

    expect(resolveThemeValue(state, registry, requestFor('default'))).toMatchObject({ status: 'resolved', value: '#334155', source: 'global' })
    expect(resolveThemeValue(state, registry, requestFor('primary'))).toMatchObject({ value: '#4f46e5', source: 'variant' })
    expect(resolveThemeValue(state, registry, requestFor('primary', 'hover'))).toMatchObject({ value: '#4338ca', source: 'state' })
  })

  it('returns registry defaults and unresolved results without inventing values', () => {
    expect(resolveThemeValue(emptyTheme, registry, requestWithDefault)).toMatchObject({ status: 'resolved', source: 'registry-default' })
    expect(resolveThemeValue(emptyTheme, registry, requestWithoutDefault)).toEqual({ status: 'unresolved', targetId: 'button.primary', controlId: 'border' })
  })

  it('rejects unknown IDs, controls, unsupported keys, invalid values, and incompatible baselines', () => {
    expect(validateThemeOverride(unknownTarget, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unknown target/i) })
    expect(validateThemeOverride({ ...unknownTarget, targetId: 'button.primary', controlId: 'border' }, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unknown control/i) })
    expect(validateThemeOverride(unsupportedState, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*state/i) })
    expect(validateThemeOverride(invalidColor, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid value/i) })
    expect(validateThemeOverride({ ...global('#334155'), scope: 'component' }, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/component/i) })
  })

  it('preserves explicit equal-to-parent values as explicit', () => {
    const state = withOverrides(global('#334155'), component('#334155'))

    expect(resolveThemeValue(state, registry, componentRequest)).toMatchObject({ value: '#334155', source: 'component' })
  })

  it('does not throw while resolving a quarantined invalid external override', () => {
    expect(() => resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).not.toThrow()
    expect(resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).toMatchObject({ status: 'resolved', source: 'registry-default' })
    expect(validateThemeState(invalidExternalTheme, registry)).toMatchObject({ valid: false })
  })

  it('does not mutate state while resolving inherited values', () => {
    const state = withOverrides(global('#334155'), variant('#4f46e5'))
    const before = structuredClone(state)

    resolveThemeValue(state, registry, requestFor('primary'))

    expect(state).toEqual(before)
  })
})
