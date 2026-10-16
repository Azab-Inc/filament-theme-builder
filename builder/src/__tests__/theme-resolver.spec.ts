import { describe, expect, it } from 'vitest'

import type { ResolveRequest, ThemeOverride, ThemeState } from '@/models/theme.model'
import { resolveThemeValue } from '@/utils/theme-resolver'
import {
  component, componentRequest, emptyTheme, global, registry, requestFor, requestWithDefault,
  requestWithoutDefault, resolverRegistry, stateValue, variant, withOverrides,
} from './theme-resolver.fixtures'

describe('theme resolution and inheritance', () => {
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
    const request: ResolveRequest = { targetId: 'form.test.fixture', controlId: 'background', componentId: 'form', variantId: 'default', stateId: 'focus' }
    const state = withOverrides(
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'global', value: '#111827' },
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'component', componentId: 'form', value: '#1f2937' },
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'variant', componentId: 'form', variantId: 'default', value: '#374151' },
      { targetId: 'form.test.fixture', controlId: 'background', scope: 'state', componentId: 'form', variantId: 'default', stateId: 'focus', value: '#4b5563' },
    )

    expect(resolveThemeValue(state, resolverRegistry, request)).toEqual({ status: 'resolved', value: '#4b5563', source: 'state' })
    expect(resolveThemeValue(state, resolverRegistry, { ...request, stateId: undefined })).toEqual({ status: 'resolved', value: '#374151', source: 'variant' })
    expect(resolveThemeValue(state, registry, { ...request, targetId: 'form.control.text', stateId: 'hover' })).toMatchObject({ status: 'invalid-request' })
  })

  it('resolves the production Product name target through global, component, variant, and focus state inheritance', () => {
    const request: ResolveRequest = { targetId: 'form.product-name', controlId: 'background', componentId: 'form', variantId: 'default', stateId: 'focus' }
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

  it('uses a valid legacy primary value before the registry default', () => {
    const legacyState: ThemeState = { schemaVersion: 1, colors: { primary: '#123456' } }

    expect(resolveThemeValue(legacyState, registry, { targetId: 'global.primary', controlId: 'primary' })).toEqual({ status: 'resolved', value: '#123456', source: 'global' })
  })

  it('preserves explicit equal-to-parent values as explicit', () => {
    const state = withOverrides(global('#334155'), component('#334155'))

    expect(resolveThemeValue(state, registry, componentRequest)).toMatchObject({ value: '#334155', source: 'component' })
  })

  it('does not mutate state while resolving inherited values', () => {
    const state = withOverrides(global('#334155'), variant('#4f46e5'))
    const before = structuredClone(state)

    resolveThemeValue(state, registry, requestFor('primary'))

    expect(state).toEqual(before)
  })
})
