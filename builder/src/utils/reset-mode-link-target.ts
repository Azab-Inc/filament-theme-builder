import type { ThemeStateCurrent } from '@/models/theme.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import { clearExplicitPath } from '@/utils/foundation-provenance'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { rebuildPalette } from '@/utils/theme-store-palettes'

/** Reset inherited overrides in both modes; callers remove the associated explicit link. */
export function resetModeLinkTarget(state: ThemeStateCurrent, target: ModeLinkTarget): void {
  if (target.kind === 'raw') {
    const row = state.rawOverrides.find((item) => item.selector === target.selector)
    if (!row) return
    delete row.properties[target.property]
    if (row.darkProperties) delete row.darkProperties[target.property]
    if (!Object.keys(row.properties).length && !Object.keys(row.darkProperties ?? {}).length) state.rawOverrides = state.rawOverrides.filter((item) => item !== row)
    if (row.darkProperties && !Object.keys(row.darkProperties).length) delete row.darkProperties
  } else if (target.kind === 'semantic') {
    state.overrides = state.overrides.filter((item) => !(['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId'] as const).every((key) => item[key] === target[key]))
  } else if (target.kind === 'palette-base' || target.kind === 'palette-shade') {
    const palette = state.foundations.palettes[target.name]
    const path = target.kind === 'palette-base' ? 'base' : `overrides.${target.shade}`
    if (target.kind === 'palette-base') {
      palette.base = createDefaultFoundationState().palettes[target.name].base
      if (palette.dark) delete palette.dark.base
      if (target.name === 'primary') state.colors.primary = palette.base
    } else {
      delete palette.overrides[target.shade]
      if (palette.dark?.overrides) delete palette.dark.overrides[target.shade]
    }
    clearExplicitPath(state.foundations, `palettes.${target.name}.${path}`)
    clearExplicitPath(state.foundations, `palettes.${target.name}.dark.${path}`)
    rebuildPalette(palette); rebuildPalette(palette, 'dark')
  }
}
