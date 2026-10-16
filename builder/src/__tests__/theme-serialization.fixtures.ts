import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ResolveRequest, ThemeOverride, ThemeState } from '@/models/theme.model'
import { createThemeRegistry, validateRegistry } from '@/registry/theme-registry'

export const registry = createThemeRegistry()
export const expandedRegistry: FilamentRegistry = validateRegistry(registry.entries.map((entry) => entry.id === 'button.primary'
  ? {
      ...entry,
      controls: [...entry.controls, { id: 'label', valueType: 'string' as const, defaultValue: 'Primary button' }],
    }
  : entry))
export const primaryScope: ResolveRequest = {
  targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId: 'primary', stateId: 'hover',
}
export const globalOverride: ThemeOverride = {
  targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#334155',
}
export const equalChildOverride: ThemeOverride = {
  targetId: 'button.primary', controlId: 'background', scope: 'component', componentId: 'button', value: '#334155',
}
export const inheritedStateCopy: ThemeOverride = { ...equalChildOverride, scope: 'variant', variantId: 'primary' }
export const variantOverride: ThemeOverride = {
  targetId: 'button.primary', controlId: 'background', scope: 'variant', componentId: 'button', variantId: 'primary', value: '#4f46e5',
}
export const themeWithGlobalAndEqualChild: ThemeState = {
  schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [globalOverride, equalChildOverride],
}
export const themeWithGlobalAndVariant: ThemeState = {
  schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [globalOverride, variantOverride],
}
export const expandedTheme: ThemeState = {
  schemaVersion: 2,
  colors: { primary: '#6366f1' },
  overrides: [globalOverride, variantOverride, {
    targetId: 'button.primary', controlId: 'label', scope: 'global', value: 'Configured button',
  }],
}
export const invalidTheme: ThemeState = {
  ...themeWithGlobalAndVariant, overrides: [{ ...globalOverride, value: 'not-a-color' }],
}
export const unresolvedRegistry: FilamentRegistry = validateRegistry(registry.entries.map((entry) => ({
  ...entry,
  controls: entry.controls.map(({ defaultValue: _defaultValue, globalValue: _globalValue, ...control }) => control),
})))
export const unresolvedTheme: ThemeState = { schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [] }
