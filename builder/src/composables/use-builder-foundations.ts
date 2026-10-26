import { computed } from 'vue'
import type { Density, PaletteName, PaletteShade, ThemeMode } from '@/models/foundations.model'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'
import { isExplicitPath, isModeInherited } from '@/utils/foundation-provenance'
import { validateFoundationColor } from '@/utils/foundation-validation'
import type { FoundationModeValueChange } from '@/components/foundations-surface-controls.model'
import type { PaletteBaseChange, PaletteShadeChange, PaletteShadeReset } from '@/components/foundations-palette-controls.model'
import type { BuilderState } from './use-builder-state'

export function useBuilderFoundations(state: BuilderState) {
  const resolvedFoundation = computed(() => state.theme.resolveFoundation(state.activeMode.value))
  const primaryColor = computed({ get: () => state.theme.theme.colors.primary, set: (color: string) => state.theme.setPrimaryColor(color) })
  const surfaceNames = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
  const borderNames = ['default', 'strong'] as const
  const textNames = ['primary', 'muted', 'disabled'] as const
  function mappingIdFor(path: string): string {
    const palette = /^palettes\.([^.]+)\.(base|shades)(?:\.(\d+))?$/.exec(path)
    if (palette) return `palette.${palette[1]}.${palette[2]}${palette[3] ? `.${palette[3]}` : ''}`
    const mode = /^(surfaces|borders|text)\.([^.]+)$/.exec(path)
    return mode ? `${mode[1] === 'surfaces' ? 'surface' : mode[1] === 'borders' ? 'border' : 'text'}.${mode[2]}` : path
  }
  function getPath(root: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => value !== null && typeof value === 'object' && key in value ? (value as Record<string, unknown>)[key] : undefined, root)
  }
  function statusFor(path: string): string {
    const inventory = lookupFoundationMapping(mappingIdFor(path))
    if (!inventory) return 'unmapped'
    if (inventory.mapping !== 'preview-emulatable') return inventory.mapping
    const provenancePath = /^(surfaces|borders|text)\./.test(path) ? `${path}.${state.activeMode.value}` : path
    const shade = /^palettes\.([^.]+)\.shades\.(\d+)$/.exec(path)
    if (shade) return state.foundation.value.palettes[shade[1] as PaletteName]?.overrides[Number(shade[2]) as PaletteShade] ? 'explicit' : 'generated'
    if (/^(surfaces|borders|text)\./.test(path) && isModeInherited(state.foundation.value, path.split('.')[0]!, path.split('.')[1]!, state.activeMode.value)) return 'inherited'
    return isExplicitPath(state.foundation.value, provenancePath) || JSON.stringify(getPath(state.foundation.value, provenancePath)) !== JSON.stringify(getPath(state.defaultFoundation, provenancePath)) ? 'explicit' : 'inherited'
  }
  function reset(path: string): void { delete state.foundationErrors.value[path]; state.theme.resetFoundation(path) }
  function setMode(mode: ThemeMode): void { state.activeMode.value = mode }
  function setDensity(value: Density): void { state.theme.setDensity(value) }
  function setPaletteBase(change: PaletteBaseChange): void { state.theme.setPaletteBase(change.name, change.value) }
  function resetPaletteBase(name: PaletteName): void { reset(`palettes.${name}.base`) }
  function setPaletteShade(change: PaletteShadeChange): void { if (change.value) state.theme.setPaletteShadeOverride(change.name, change.shade, change.value) }
  function resetPaletteShade(change: PaletteShadeReset): void { state.theme.resetPaletteShade(change.name, change.shade) }
  function setModeValue(change: FoundationModeValueChange): void {
    const path = `${change.path}.${state.activeMode.value}`
    const value = (change.event.target as HTMLInputElement).value
    const validation = validateFoundationColor(value)
    if (!validation.valid) { state.foundationErrors.value[path] = validation.message; return }
    delete state.foundationErrors.value[path]; state.theme.setFoundation(path, value)
  }
  function foundationError(path: string): string | undefined { return state.foundationErrors.value[path] }
  return { resolvedFoundation, primaryColor, surfaceNames, borderNames, textNames, statusFor, reset, setMode, setDensity, setPaletteBase, resetPaletteBase, setPaletteShade, resetPaletteShade, setModeValue, foundationError }
}
