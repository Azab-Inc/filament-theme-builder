import { describe, expect, it } from 'vitest'

import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
import type { ResolveRequest, ThemeOverride, ThemeState } from '@/models/theme.model'
import { createThemeRegistry, validateRegistry } from '@/registry/theme-registry'
import { resolveThemeValue } from '@/services/theme-resolver'
import { validateThemeOverride, validateThemeState } from '@/services/theme-validation'

const registry: FilamentRegistry = createThemeRegistry()
const formResolverFixture: RegistryEntry = {
  id: 'form.test.fixture',
  label: 'Resolver test fixture',
  family: 'form',
  selectors: ['.fi-test-form-control'],
  controls: [{ id: 'background', valueType: 'color', constraints: { pattern: /^#[\da-f]{6}$/i } }],
  variants: ['default', 'alternate'],
  states: ['focus', 'disabled'],
  filamentCompatibility: '5.x',
}
const resolverRegistry = validateRegistry([...registry.entries, formResolverFixture])
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

    expect(resolveThemeValue(state, registry, requestFor('default'))).toMatchObject({ status: 'invalid-request' })
    expect(resolveThemeValue(state, registry, requestFor('secondary'))).toMatchObject({ value: '#475569', source: 'component' })
    expect(resolveThemeValue(state, registry, requestFor('primary', 'focus'))).toMatchObject({ status: 'invalid-request' })
    expect(resolveThemeValue(state, registry, requestFor('primary', 'hover'))).toMatchObject({ value: '#4338ca', source: 'state' })
  })

  it('returns registry defaults and unresolved results without inventing values', () => {
    expect(resolveThemeValue(emptyTheme, registry, requestWithDefault)).toEqual({ status: 'resolved', value: '#6366f1', source: 'global' })
    expect(resolveThemeValue(emptyTheme, registry, requestWithoutDefault)).toMatchObject({ status: 'invalid-request', targetId: 'button.primary', controlId: 'border' })
  })

  it('resolves a separate deterministic form fixture across all inheritance levels', () => {
    const request: ResolveRequest = {
      targetId: 'form.test.fixture',
      controlId: 'background',
      componentId: 'form',
      variantId: 'default',
      stateId: 'focus',
    }
    const state = withOverrides(
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'global', value: '#111827' },
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'component', componentId: 'form', value: '#1f2937' },
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'variant', componentId: 'form', variantId: 'default', value: '#374151' },
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'state', componentId: 'form', variantId: 'default', stateId: 'focus', value: '#4b5563' },
    )

    expect(resolveThemeValue(state, resolverRegistry, request)).toEqual({ status: 'resolved', value: '#4b5563', source: 'state' })
    expect(resolveThemeValue(state, resolverRegistry, { ...request, stateId: 'disabled' })).toEqual({ status: 'resolved', value: '#374151', source: 'variant' })
    expect(resolveThemeValue(state, resolverRegistry, { ...request, targetId: 'form.control.text', stateId: 'server-validation' })).toMatchObject({ status: 'invalid-request' })
  })

  it('resolves the production Product name target through global, component, variant, and focus state inheritance', () => {
    const request: ResolveRequest = {
      targetId: 'form.product-name',
      controlId: 'background',
      componentId: 'form',
      variantId: 'default',
      stateId: 'focus',
    }
    const overrides: ThemeOverride[] = [
      { targetId: 'form.product-name', controlId: 'background', scope: 'global', value: '#111827' },
      { targetId: 'form.product-name', controlId: 'background', scope: 'component', componentId: 'form', value: '#1f2937' },
      { targetId: 'form.product-name', controlId: 'background', scope: 'variant', componentId: 'form', variantId: 'default', value: '#374151' },
      { targetId: 'form.product-name', controlId: 'background', scope: 'state', componentId: 'form', variantId: 'default', stateId: 'focus', value: '#4b5563' },
    ]

    expect(resolveThemeValue(withOverrides(...overrides), registry, request)).toEqual({ status: 'resolved', value: '#4b5563', source: 'state' })
    expect(resolveThemeValue(withOverrides(...overrides.slice(0, 3)), registry, { ...request, stateId: undefined })).toEqual({ status: 'resolved', value: '#374151', source: 'variant' })
    expect(resolveThemeValue(withOverrides(...overrides.slice(0, 2)), registry, { ...request, stateId: undefined })).toEqual({ status: 'resolved', value: '#1f2937', source: 'component' })
    expect(resolveThemeValue(withOverrides(overrides[0]!), registry, { ...request, stateId: undefined })).toEqual({ status: 'resolved', value: '#111827', source: 'global' })
  })

  it('resets the form fixture child and follows a changed parent without copying values', () => {
    const parent: ThemeOverride = { targetId: 'form.test.fixture', controlId: 'background', scope: 'component', componentId: 'form', value: '#1f2937' }
    const child: ThemeOverride = { targetId: 'form.test.fixture', controlId: 'background', scope: 'variant', componentId: 'form', variantId: 'default', value: '#374151' }
    const request: ResolveRequest = { targetId: 'form.test.fixture', controlId: 'background', componentId: 'form', variantId: 'default' }

    expect(resolveThemeValue(withOverrides(parent, child), resolverRegistry, request)).toMatchObject({ value: '#374151', source: 'variant' })
    expect(resolveThemeValue(withOverrides({ ...parent, value: '#0f766e' }), resolverRegistry, request)).toMatchObject({ value: '#0f766e', source: 'component' })
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
    const unsupportedRegistry = {
      entries: registry.entries.map((entry) => ({ ...entry, filamentCompatibility: '4.x' })),
    } as FilamentRegistry
    const mismatchedRegistry = {
      entries: registry.entries.map((entry, index) => index === 0 ? { ...entry, filamentCompatibility: '4.x' } : entry),
    } as FilamentRegistry

    expect(validateThemeOverride(global('#334155'), unsupportedRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*compatibility.*baseline/i) })
    expect(validateThemeOverride(global('#334155'), mismatchedRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/compatibility.*baseline/i) })
    expect(validateThemeOverride(global('#334155'), { entries: [{ ...registry.entries[0], filamentCompatibility: 'future' }] } as FilamentRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/compatibility.*baseline/i) })
  })

  it('uses a valid legacy primary value before the registry default', () => {
    const legacyState: ThemeState = { schemaVersion: 1, colors: { primary: '#123456' } }

    expect(resolveThemeValue(legacyState, registry, { targetId: 'global.primary', controlId: 'primary' })).toEqual({ status: 'resolved', value: '#123456', source: 'global' })
  })

  it('preserves explicit equal-to-parent values as explicit', () => {
    const state = withOverrides(global('#334155'), component('#334155'))

    expect(resolveThemeValue(state, registry, componentRequest)).toMatchObject({ value: '#334155', source: 'component' })
  })

  it('does not throw while resolving a quarantined invalid external override', () => {
    expect(() => resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).not.toThrow()
    expect(resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).toMatchObject({ status: 'invalid-state' })
    expect(validateThemeState(invalidExternalTheme, registry)).toMatchObject({ valid: false, invalidOverrides: [{ targetId: 'button.primary', controlId: 'background', scope: 'global', error: expect.stringMatching(/invalid value/i) }] })
  })

  it('returns a typed invalid result for malformed or unsupported resolve requests', () => {
    const requests: unknown[] = [
      null,
      [],
      { targetId: 'button.primary' },
      { targetId: 'button.primary', controlId: 'background', componentId: 42 },
      { targetId: 'button.primary', controlId: 'background', variantId: 'primary' },
      { targetId: 'button.primary', controlId: 'background', extra: true },
      { targetId: 'button.unknown', controlId: 'background' },
      { targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId: 'unknown' },
    ]

    for (const request of requests) {
      expect(() => resolveThemeValue(emptyTheme, registry, request as never)).not.toThrow()
      expect(resolveThemeValue(emptyTheme, registry, request as never)).toMatchObject({ status: 'invalid-request' })
    }
  })

  it('does not resolve duplicate override identities by array order', () => {
    const duplicateState = withOverrides(global('#334155'), global('#4f46e5'))

    expect(validateThemeState(duplicateState, registry)).toMatchObject({
      valid: false,
      invalidOverrides: expect.arrayContaining([expect.objectContaining({ error: expect.stringMatching(/duplicate.*button\.primary.*background/i) })]),
    })
    expect(resolveThemeValue(duplicateState, registry, requestFor('primary'))).toMatchObject({ status: 'invalid-state' })
  })

  it('does not mutate state while resolving inherited values', () => {
    const state = withOverrides(global('#334155'), variant('#4f46e5'))
    const before = structuredClone(state)

    resolveThemeValue(state, registry, requestFor('primary'))

    expect(state).toEqual(before)
  })
})
