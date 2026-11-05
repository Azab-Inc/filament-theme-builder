import { computed, reactive, ref } from 'vue'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import type { PaletteName, PaletteShade } from '@/models/foundations.model'
import type { VisualSection } from '@/models/visual-prototype.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { generatePalette } from '@/utils/palette-generator'

export function useVisualPrototype() {
  const theme = reactive(createDefaultThemeState())
  const section = ref<VisualSection>('Foundations')
  const expandedPalette = ref<PaletteName | null>('primary')
  const editedCount = (name: PaletteName) => Object.keys(theme.foundations.palettes[name].overrides).length
  const paletteNames = PALETTE_NAMES
  const shades = PALETTE_SHADES
  const counts = computed(() => Object.fromEntries(PALETTE_NAMES.map((name) => [name, editedCount(name)])) as Record<PaletteName, number>)
  const initialBases = Object.fromEntries(PALETTE_NAMES.map((name) => [name, theme.foundations.palettes[name].base])) as Record<PaletteName, string>
  const paletteEditCount = computed(() => PALETTE_NAMES.reduce((total, name) => total + editedCount(name) + Number(theme.foundations.palettes[name].base !== initialBases[name]), 0))
  const activePalette = computed(() => expandedPalette.value ?? 'primary')
  function setBase(name: PaletteName, value: string) {
    if (!/^#[\da-f]{6}$/i.test(value)) return
    const palette = theme.foundations.palettes[name]
    palette.base = value.toLowerCase()
    palette.shades = { ...generatePalette(palette.base), ...palette.overrides }
  }
  function setShade(name: PaletteName, shade: PaletteShade, value: string) {
    if (!/^#[\da-f]{6}$/i.test(value)) return
    const palette = theme.foundations.palettes[name]
    palette.overrides[shade] = value.toLowerCase()
    palette.shades[shade] = value.toLowerCase()
  }
  function resetShade(name: PaletteName, shade: PaletteShade) {
    const palette = theme.foundations.palettes[name]
    delete palette.overrides[shade]
    palette.shades[shade] = generatePalette(palette.base)[shade]
  }
  function resetBase(name: PaletteName) {
    const defaults = createDefaultThemeState().foundations.palettes[name]
    const palette = theme.foundations.palettes[name]
    palette.base = defaults.base
    palette.overrides = {}
    palette.shades = { ...defaults.shades }
  }
  function togglePalette(name: PaletteName) {
    expandedPalette.value = expandedPalette.value === name ? null : name
  }
  return { theme, section, expandedPalette, activePalette, paletteNames, shades, counts, paletteEditCount, setBase, setShade, resetShade, resetBase, togglePalette }
}
