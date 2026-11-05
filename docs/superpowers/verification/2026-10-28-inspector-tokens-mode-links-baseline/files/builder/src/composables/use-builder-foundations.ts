import { computed } from 'vue'
import { PALETTE_SHADES, type Density, type PaletteName, type PaletteShade, type ThemeMode } from '@/models/foundations.model'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'
import { isExplicitPath, isModeInherited } from '@/utils/foundation-provenance'
import { validateFoundationColor } from '@/utils/foundation-validation'
import type { FoundationModeValueChange } from '@/components/foundations-surface-controls.model'
import type { PaletteBaseChange, PaletteShadeChange, PaletteShadeReset } from '@/components/foundations-palette-controls.model'
import type { BuilderState } from './use-builder-state'
import { resolvePaletteShade } from '@/utils/theme-store-palettes'

export function useBuilderFoundations(state: BuilderState) {
  const resolvedFoundation = computed(() => state.theme.resolveFoundation(state.activeMode.value))
  const palettes = computed(() => Object.fromEntries(Object.entries(state.foundation.value.palettes).map(([name, palette]) => {
    const mode = state.activeMode.value
    const base = mode === 'dark' ? palette.dark?.base ?? palette.base : palette.base
    const shades = Object.fromEntries(PALETTE_SHADES.map((shade) => [shade, resolvePaletteShade(palette, shade, mode)])) as typeof palette.shades
    const overrides = mode === 'dark' ? (palette.dark?.overrides ?? {}) : palette.overrides
    return [name, { base, shades, overrides }]
  })) as typeof state.foundation.value.palettes)
  const primaryColor = computed({ get: () => state.activeMode.value === 'dark' ? state.foundation.value.palettes.primary.dark?.base ?? state.foundation.value.palettes.primary.base : state.theme.theme.colors.primary, set: (color: string) => state.theme.setPrimaryColor(color, state.activeMode.value) })
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
    if (shade) {
       const palette = state.foundation.value.palettes[shade[1] as PaletteName]
       const explicit = state.activeMode.value === 'dark' ? palette?.dark?.overrides?.[Number(shade[2]) as PaletteShade] : palette?.overrides[Number(shade[2]) as PaletteShade]
       return explicit ? 'explicit' : state.activeMode.value === 'dark' && !palette?.dark?.base ? 'inherited' : 'generated'
     }
    const paletteBase = /^palettes\.([^.]+)\.base$/.exec(path)
    if (paletteBase) {
      const palette = state.foundation.value.palettes[paletteBase[1] as PaletteName]
      if (state.activeMode.value === 'dark') return palette?.dark?.base ? 'explicit' : 'inherited'
    }
    if (/^(surfaces|borders|text)\./.test(path) && isModeInherited(state.foundation.value, path.split('.')[0]!, path.split('.')[1]!, state.activeMode.value)) return 'inherited'
    return isExplicitPath(state.foundation.value, provenancePath) || JSON.stringify(getPath(state.foundation.value, provenancePath)) !== JSON.stringify(getPath(state.defaultFoundation, provenancePath)) ? 'explicit' : 'inherited'
  }
  function reset(path: string): void { delete state.foundationErrors.value[path]; state.theme.resetFoundation(path) }
  function setMode(mode: ThemeMode): void { state.activeMode.value = mode }
  function setDensity(value: Density): void { state.theme.setDensity(value) }
  function setPaletteBase(change: PaletteBaseChange): void { state.theme.setPaletteBase(change.name, change.value, state.activeMode.value) }
  function resetPaletteBase(name: PaletteName): void { reset(state.activeMode.value === 'dark' ? `palettes.${name}.dark.base` : `palettes.${name}.base`) }
  function setPaletteShade(change: PaletteShadeChange): void { if (change.value) state.theme.setPaletteShadeOverride(change.name, change.shade, change.value, state.activeMode.value) }
  function resetPaletteShade(change: PaletteShadeReset): void { state.theme.resetPaletteShade(change.name, change.shade, state.activeMode.value) }
  function setModeValue(change: FoundationModeValueChange): void {
    const path = `${change.path}.${state.activeMode.value}`
    const value = (change.event.target as HTMLInputElement).value
    const validation = validateFoundationColor(value)
    if (!validation.valid) { state.foundationErrors.value[path] = validation.message; return }
    delete state.foundationErrors.value[path]; state.theme.setFoundation(path, value)
  }
  function foundationError(path: string): string | undefined { return state.foundationErrors.value[path] }
  return { resolvedFoundation, palettes, primaryColor, surfaceNames, borderNames, textNames, statusFor, reset, setMode, setDensity, setPaletteBase, resetPaletteBase, setPaletteShade, resetPaletteShade, setModeValue, foundationError }
}
