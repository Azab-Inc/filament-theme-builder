import type { ThemeMode } from '@/models/foundations.model'
import { PALETTE_SHADES } from '@/models/foundations.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { RawElementOverride } from '@/models/raw-overrides.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateCurrent, ThemeValue } from '@/models/theme.model'
import { validateRawElementOverride } from '@/utils/raw-override-validation'
import { resolveThemeValue } from '@/utils/theme-resolver'
import { resolvePaletteShade, rebuildPalette } from '@/utils/theme-store-palettes'
import { markExplicitPath, resolveModeValue } from '@/utils/foundation-provenance'
import { validateThemeOverride } from '@/utils/theme-override-validation'
import { validateResolveRequest } from '@/utils/resolve-request-validation'
import { validModeLinkTarget } from '@/utils/mode-link-target-validation'

export function readModeLinkTarget(state: ThemeStateCurrent, target: ModeLinkTarget, mode: ThemeMode, registry: FilamentRegistry): ThemeValue | undefined {
  if (!validModeLinkTarget(target, registry)) return undefined
  if (target.kind === 'raw') { const item = state.rawOverrides.find((row) => row.selector === target.selector); return (mode === 'dark' ? item?.darkProperties?.[target.property] ?? item?.properties[target.property] : item?.properties[target.property]) ?? '' }
  if (target.kind === 'semantic') {
    const found = state.overrides.find((row) => sameSemantic(row, target))
    if (mode === 'light' ? found?.value !== undefined : found?.darkValue !== undefined) return mode === 'light' ? found!.value : found!.darkValue
    const request = { targetId: target.targetId, controlId: target.controlId, mode, ...(target.componentId ? { componentId: target.componentId } : {}), ...(target.variantId ? { variantId: target.variantId } : {}), ...(target.stateId ? { stateId: target.stateId } : {}) }
    const colors = { primary: mode === 'dark' ? state.foundations.palettes.primary.dark?.base ?? state.colors.primary : state.colors.primary }
    const resolved = resolveThemeValue({ schemaVersion: 2, colors, overrides: state.overrides }, registry, request)
    return resolved.status === 'resolved' ? resolved.value : undefined
  }
  if (target.kind === 'foundation') { const [group, name] = target.path.split('.'); const item = group && name ? (state.foundations[group as 'surfaces' | 'borders' | 'text'] as Record<string, {light:string;dark:string}>)[name] : undefined; return item ? resolveModeValue<string>(state.foundations, item, group!, name!, mode) : undefined }
  if (target.kind === 'user-color') { const item = state.foundations.userTokens?.colors[target.name]; return mode === 'dark' ? item?.dark ?? item?.light : item?.light }
  if (target.kind === 'palette-base') { const palette = state.foundations.palettes[target.name]; return mode === 'dark' ? palette.dark?.base ?? palette.base : palette.base }
  if (target.kind === 'palette-shade') return resolvePaletteShade(state.foundations.palettes[target.name], target.shade, mode)
  const palette = state.foundations.userTokens?.palettes[target.name]
  if (!palette) return undefined
  if (target.kind === 'user-palette-base') return mode === 'dark' ? palette.base.dark ?? palette.base.light : palette.base.light
  const shade = palette.shades[target.shade]; return mode === 'dark' ? shade?.dark ?? shade?.light : shade?.light
}

export function writeModeLinkTarget(state: ThemeStateCurrent, target: ModeLinkTarget, value: ThemeValue, _mode: ThemeMode, registry: FilamentRegistry): boolean {
  if (!validModeLinkTarget(target, registry)) return false
  if (target.kind === 'raw') return typeof value === 'string' && writeRaw(state, target, value)
  if (target.kind === 'semantic') return writeSemantic(state, target, value, registry)
  if (typeof value !== 'string' || value.length === 0) return false
  if (target.kind === 'foundation') { const [group, name] = target.path.split('.'); const item = group && name ? (state.foundations[group as 'surfaces' | 'borders' | 'text'] as Record<string, {light:string;dark:string}>)[name] : undefined; if (!item) return false; item.light = value; item.dark = value; markExplicitPath(state.foundations, `${target.path}.light`); markExplicitPath(state.foundations, `${target.path}.dark`); return true }
  if (target.kind === 'user-color') { const item = state.foundations.userTokens?.colors[target.name]; if (!item) return false; item.light = String(value); item.dark = String(value); return true }
  if (target.kind === 'palette-base' || target.kind === 'palette-shade') return writeBuiltinPalette(state, target, value)
  return writeUserPalette(state, target, value)
}

export { resetModeLinkTarget } from '@/utils/reset-mode-link-target'

function writeRaw(state: ThemeStateCurrent, target: Extract<ModeLinkTarget, {kind:'raw'}>, value: string): boolean {
  const validity = validateRawElementOverride({ selector: target.selector, properties: { [target.property]: value }, darkProperties: { [target.property]: value } })
  if (!validity.valid) return false
  let item = state.rawOverrides.find((row) => row.selector === target.selector)
  if (!item) { item = { selector: target.selector, properties: {} }; state.rawOverrides.push(item) }
  item.properties[target.property] = value
  item.darkProperties = { ...(item.darkProperties ?? {}), [target.property]: value }
  return true
}

function writeSemantic(state: ThemeStateCurrent, target: Extract<ModeLinkTarget,{kind:'semantic'}>, value: ThemeValue, registry: FilamentRegistry): boolean {
  const request = { targetId: target.targetId, controlId: target.controlId, ...(target.componentId ? { componentId: target.componentId } : {}), ...(target.variantId ? { variantId: target.variantId } : {}), ...(target.stateId ? { stateId: target.stateId } : {}) }
  if (!validateResolveRequest(request, registry).valid) return false
  let item = state.overrides.find((row) => sameSemantic(row, target))
  const created = !item
  if (!item) { item = { ...request, scope: target.scope }; state.overrides.push(item) }
  if (!validateThemeOverride({ ...item, value, darkValue: value }, registry).valid) { if (created) state.overrides.pop(); return false }
  item.value = value; item.darkValue = value
  return true
}

function sameSemantic(row: ThemeStateCurrent['overrides'][number], target: Extract<ModeLinkTarget,{kind:'semantic'}>): boolean {
  return row.targetId === target.targetId && row.controlId === target.controlId && row.scope === target.scope && row.componentId === target.componentId && row.variantId === target.variantId && row.stateId === target.stateId
}

function writeBuiltinPalette(state: ThemeStateCurrent, target: Extract<ModeLinkTarget,{kind:'palette-base'|'palette-shade'}>, value: string): boolean {
  const palette = state.foundations.palettes[target.name]
  if (target.kind === 'palette-base') { palette.base = value; palette.dark = { ...(palette.dark ?? {}), base: value }; if (target.name === 'primary') state.colors.primary = value; markExplicitPath(state.foundations, `palettes.${target.name}.base`); markExplicitPath(state.foundations, `palettes.${target.name}.dark.base`) }
  else { palette.overrides[target.shade] = value; palette.dark = { ...(palette.dark ?? {}), overrides: { ...(palette.dark?.overrides ?? {}), [target.shade]: value } }; markExplicitPath(state.foundations, `palettes.${target.name}.overrides.${target.shade}`); markExplicitPath(state.foundations, `palettes.${target.name}.dark.overrides.${target.shade}`) }
  rebuildPalette(palette); return true
}

function writeUserPalette(state: ThemeStateCurrent, target: Extract<ModeLinkTarget,{kind:'user-palette-base'|'user-palette-shade'}>, value: string): boolean {
  const palette = state.foundations.userTokens?.palettes[target.name]; if (!palette) return false
  if (target.kind === 'user-palette-base') { palette.base.light = value; palette.base.dark = value; for (const shade of PALETTE_SHADES) { const color = resolvePaletteShade({ base: value, shades: {}, overrides: {} }, shade, 'light'); palette.shades[shade] = { light: color, dark: color } } }
  else { const shade = palette.shades[target.shade]; if (!shade) return false; shade.light = value; shade.dark = value }
  return true
}
