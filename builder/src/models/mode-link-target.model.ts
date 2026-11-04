import type { PaletteName, PaletteShade } from '@/models/foundations.model'
import type { ThemeOverride } from '@/models/theme.model'
import type { RawVisualProperty } from '@/models/raw-overrides.model'

export type ModeLinkTarget =
  | { kind: 'foundation'; path: string }
  | { kind: 'user-color'; name: string }
  | { kind: 'raw'; selector: string; property: RawVisualProperty }
  | { kind: 'semantic'; targetId: string; controlId: string; scope: ThemeOverride['scope']; componentId?: string; variantId?: string; stateId?: string }
  | { kind: 'palette-base'; name: PaletteName }
  | { kind: 'palette-shade'; name: PaletteName; shade: PaletteShade }
  | { kind: 'user-palette-base'; name: string }
  | { kind: 'user-palette-shade'; name: string; shade: PaletteShade }

export type ModeLinkToggleResult = { ok: boolean; requiresConfirmation: boolean; error?: string }

export function modeLinkTargetIdentity(target: ModeLinkTarget): string {
  if (target.kind === 'foundation') return `foundation.${target.path}`
  if (target.kind === 'user-color') return `user.color.${target.name}`
  return `target:${JSON.stringify(Object.fromEntries(Object.entries(target).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)))}`
}
