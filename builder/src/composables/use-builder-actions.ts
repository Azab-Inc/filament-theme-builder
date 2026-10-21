import type { BuilderState } from './use-builder-state'
import type { IconPackName, ResourceIconKey } from '@/models/icons.model'
import type { PanelBrandingSetting } from '@/models/panel-branding.model'
import type { BrandingSettingChange } from '@/components/branding-settings-panel.model'
import type { SemanticComponentRow } from '@/components/semantic-component-controls.model'
import type { ThemeOverride, ThemeScope } from '@/models/theme.model'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { RawPropertyChange, RawPropertyReset, RawSelectorChange } from '@/components/advanced-raw-inspector.dto'
import { validateRawSelector } from '@/utils/raw-override-validation'
import { ICON_PACK_NAMES, RESOURCE_ICON_KEYS, ICON_PACK_PRESETS } from '@/registry/icon-registry'
import { computed } from 'vue'

export function useBuilderActions(state: BuilderState) {
  const iconOptions = ['heroicon-o-cube', 'heroicon-o-star', 'heroicon-o-bolt', 'heroicon-o-heart', 'heroicon-o-check-circle', 'heroicon-s-cube', 'heroicon-s-star', 'heroicon-s-bolt', 'heroicon-s-heart', 'heroicon-s-check-circle', 'heroicon-m-cube', 'heroicon-m-star', 'heroicon-m-bolt', 'heroicon-m-heart', 'heroicon-m-check-circle']
  const iconPreviews = computed(() => Object.fromEntries(RESOURCE_ICON_KEYS.map((key) => [key, state.theme.theme.icons.overrides[key] ?? ICON_PACK_PRESETS[state.theme.theme.icons.pack][key]])) as Record<ResourceIconKey, string>)
  const productNameTarget = { targetId: 'form.product-name', controlId: 'background' } as const
  const productNameContext = { componentId: 'form', variantId: 'default', stateId: 'focus' } as const
  const productNameScopes: ReadonlyArray<{ scope: ThemeScope; label: string }> = [{ scope: 'global', label: 'Global' }, { scope: 'component', label: 'Component' }, { scope: 'variant', label: 'Variant' }, { scope: 'state', label: 'State (focus)' }]
  const productNameRows = computed(() => productNameScopes.map((row) => {
    const request = { ...productNameTarget, ...(row.scope !== 'global' ? { componentId: productNameContext.componentId } : {}), ...(row.scope === 'variant' || row.scope === 'state' ? { variantId: productNameContext.variantId } : {}), ...(row.scope === 'state' ? { stateId: productNameContext.stateId } : {}) }
    const resolution = state.theme.resolve(request)
    return { ...row, request, value: resolution.status === 'resolved' && typeof resolution.value === 'string' ? resolution.value : '', source: resolution.status === 'resolved' ? resolution.source : 'unresolved', explicit: state.theme.theme.overrides.some((candidate) => sameOverrideKey(candidate, row.scope)) }
  }))
  function applyBrandingChange(change: BrandingSettingChange): void { state.theme.setBrandingSetting(change.setting, change.value) }
  function setBrandTypography(event: Event): void { const value = (event.target as HTMLSelectElement).value; if (value === 'System') state.theme.setBrandingSetting('brandTypography', { kind: 'system', name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' }); else if (value === 'Inter' || value === 'Roboto') state.theme.setBrandingSetting('brandTypography', { kind: 'curated', name: value, family: value, provider: 'google-fonts' }) }
  function setCustomBrandTypography(event: Event): void { const value = (event.target as HTMLInputElement).value.trim(); state.theme.setBrandingSetting('brandTypography', { kind: 'custom', name: value, family: value }) }
  function setIconPack(pack: IconPackName): void { state.theme.setIconPack(pack) }
  function setIconOverride(key: ResourceIconKey, value: string): void { value ? state.theme.setSemanticResourceIcon(key, value) : state.theme.resetSemanticResourceIcon(key) }
  function setProductNameValue(row: SemanticComponentRow, event: Event): void { const value = (event.target as HTMLInputElement).value; if (/^#[\da-f]{6}$/i.test(value)) state.theme.setOverride({ ...productNameTarget, scope: row.scope, value, ...(row.scope !== 'global' ? { componentId: productNameContext.componentId } : {}), ...(row.scope === 'variant' || row.scope === 'state' ? { variantId: productNameContext.variantId } : {}), ...(row.scope === 'state' ? { stateId: productNameContext.stateId } : {}) }) }
  function resetProductNameValue(row: SemanticComponentRow): void { state.theme.resetOverride(row.request) }
  function rawPropertyValue(property: RawVisualProperty): string { return state.theme.theme.rawOverrides.find((override) => override.selector === state.rawSelector.value)?.properties[property] ?? '' }
  function setRawProperty(change: RawPropertyChange): void { if (state.rawSelector.value && validateRawSelector(state.rawSelector.value).valid) state.theme.setRawOverride(state.rawSelector.value, change.property, (change.event.target as HTMLInputElement).value.trim()) }
  function resetRawProperty(change: RawPropertyReset): void { if (state.rawSelector.value) state.theme.resetRawProperty(state.rawSelector.value, change.property) }
  function resetRawOverride(): void { if (state.rawSelector.value) state.theme.resetRawOverride(state.rawSelector.value) }
  function setRawSelector(change: RawSelectorChange): void { const next = (change.event.target as HTMLInputElement).value.trim(); const validation = validateRawSelector(next); state.rawSelectorError.value = validation.valid ? undefined : validation.error; if (validation.valid) state.rawSelector.value = next }
  function sameOverrideKey(override: ThemeOverride, scope: ThemeScope): boolean { return override.targetId === productNameTarget.targetId && override.controlId === productNameTarget.controlId && override.scope === scope && (scope === 'global' || override.componentId === productNameContext.componentId) && (scope === 'global' || scope === 'component' || override.variantId === productNameContext.variantId) && (scope !== 'state' || override.stateId === productNameContext.stateId) }
  return { iconOptions, iconPreviews, productNameRows, applyBrandingChange, setBrandTypography, setCustomBrandTypography, setIconPack, setIconOverride, setProductNameValue, resetProductNameValue, rawPropertyValue, setRawProperty, resetRawProperty, resetRawOverride, setRawSelector, iconPackNames: ICON_PACK_NAMES, resourceIconKeys: RESOURCE_ICON_KEYS }
}
