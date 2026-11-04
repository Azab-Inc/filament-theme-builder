import { PALETTE_SHADES } from '@/models/foundations.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { ThemeRelayIntent } from '@/models/theme-relay-intent.model'
import type { ThemeStateCurrent } from '@/models/theme.model'

export function isModeTarget(target: ThemeRelayIntent['target']): target is ModeLinkTarget { return target.kind !== 'user-palette' }
export function isTokenTarget(target: ThemeRelayIntent['target']): target is Extract<ThemeRelayIntent['target'], { kind: 'user-color' | 'user-palette' }> {
  if ((target.kind !== 'user-color' && target.kind !== 'user-palette') || !/^[a-z][a-z0-9-]{0,31}$/.test(target.name)) return false
  const keys = Object.keys(target)
  if (target.kind === 'user-color') return keys.every((key) => key === 'kind' || key === 'name')
  return keys.every((key) => key === 'kind' || key === 'name' || key === 'shade') && (!('shade' in target) || isPaletteShade(target.shade))
}
export function isTokenMutationTarget(target: ThemeRelayIntent['target']): target is Extract<ThemeRelayIntent['target'], { kind: 'user-color' | 'user-palette' }> | Extract<ModeLinkTarget, { kind: 'user-color' | 'user-palette-base' | 'user-palette-shade' }> {
  return isTokenTarget(target) || target.kind === 'user-palette-base' || target.kind === 'user-palette-shade'
}
export function isPaletteShade(value: unknown): value is typeof PALETTE_SHADES[number] { return PALETTE_SHADES.includes(value as typeof PALETTE_SHADES[number]) }
export function supportedTargetForAction(action: ThemeRelayIntent['action'], target: ThemeRelayIntent['target']): boolean {
  if (action === 'create-color') return target.kind === 'user-color' && isTokenTarget(target)
  if (action === 'create-palette') return target.kind === 'user-palette' && isTokenTarget(target) && !('shade' in target)
  if (action === 'update' || action === 'remove') return isTokenMutationTarget(target)
  if (action === 'reset') return target.kind === 'raw' || target.kind === 'semantic' || target.kind === 'foundation' || target.kind === 'palette-base' || target.kind === 'palette-shade'
  return target.kind !== 'user-palette'
}
export function ensureChanged(before: string, after: ThemeStateCurrent): void { if (before === JSON.stringify(after)) throw new Error('unchanged') }
