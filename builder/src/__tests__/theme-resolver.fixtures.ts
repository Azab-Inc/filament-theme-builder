import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
import type { ResolveRequest, ThemeOverride, ThemeState } from '@/models/theme.model'
import { createThemeRegistry, validateRegistry } from '@/registry/theme-registry'

export const registry: FilamentRegistry = createThemeRegistry()
const formResolverFixture: RegistryEntry = {
  id: 'form.test.fixture',
  label: 'Resolver test fixture',
  family: 'form',
  selectors: ['.fi-test-form-control'],
  controls: [{ id: 'background', valueType: 'color', constraints: { pattern: /^#[\da-f]{6}$/i } }],
  variants: ['default', 'alternate'],
  states: ['focus'],
  filamentCompatibility: '5.x',
}
export const resolverRegistry = validateRegistry([...registry.entries, formResolverFixture])

export const requestFor = (variantId?: string, stateId?: string): ResolveRequest => ({
  targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId, stateId,
})
export const global = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'global', value })
export const component = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'component', componentId: 'button', value })
export const variant = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'variant', componentId: 'button', variantId: 'primary', value })
export const stateValue = (value: string): ThemeOverride => ({ targetId: 'button.primary', controlId: 'background', scope: 'state', componentId: 'button', variantId: 'primary', stateId: 'hover', value })
export const withOverrides = (...overrides: ThemeOverride[]): ThemeState => ({ schemaVersion: 2, colors: { primary: '#6366f1' }, overrides })
export const emptyTheme = withOverrides()
export const requestWithDefault = requestFor('primary')
export const requestWithoutDefault = { ...requestWithDefault, controlId: 'border' }
export const componentRequest = requestFor('primary')

export const unknownTarget: ThemeOverride = { ...global('#334155'), targetId: 'button.unknown' }
export const unsupportedState: ThemeOverride = { ...stateValue('#4338ca'), stateId: 'focus' }
export const invalidColor: ThemeOverride = { ...global('not-a-color') }
export const invalidExternalTheme: ThemeState = withOverrides(invalidColor)
