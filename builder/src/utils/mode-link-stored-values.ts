import type { ThemeMode } from '@/models/foundations.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { ThemeStateCurrent, ThemeValue } from '@/models/theme.model'

/** Explicit values, without inheritance: used by mutation detection and import invariants. */
export function readStoredModeLinkValue(state: ThemeStateCurrent, target: ModeLinkTarget, mode: ThemeMode): ThemeValue | undefined {
  if (target.kind === 'raw') { const row = state.rawOverrides.find((item) => item.selector === target.selector); return mode === 'light' ? row?.properties[target.property] : row?.darkProperties?.[target.property] }
  if (target.kind === 'semantic') { const row = state.overrides.find((item) => item.targetId === target.targetId && item.controlId === target.controlId && item.scope === target.scope && item.componentId === target.componentId && item.variantId === target.variantId && item.stateId === target.stateId); return mode === 'light' ? row?.value : row?.darkValue }
  if (target.kind === 'foundation') { const [group, name] = target.path.split('.'); const pair = (state.foundations[group as 'surfaces' | 'borders' | 'text'] as Record<string, { light: string; dark: string }>)[name!]; return pair?.[mode] }
  if (target.kind === 'user-color') return state.foundations.userTokens.colors[target.name]?.[mode]
  if (target.kind === 'palette-base') { const palette = state.foundations.palettes[target.name]; return mode === 'light' ? palette.base : palette.dark?.base }
  if (target.kind === 'palette-shade') { const palette = state.foundations.palettes[target.name]; return mode === 'light' ? palette.overrides[target.shade] : palette.dark?.overrides?.[target.shade] }
  const palette = state.foundations.userTokens.palettes[target.name]
  if (!palette) return undefined
  return target.kind === 'user-palette-base' ? palette.base[mode] : palette.shades[target.shade]?.[mode]
}

export function legacyModeLinkTarget(identity: string): ModeLinkTarget | null {
  if (/^foundation\.(surfaces|borders|text)\.[a-z-]+$/.test(identity)) return { kind: 'foundation', path: identity.slice('foundation.'.length) }
  const color = /^user\.color\.([a-z][a-z0-9-]{0,31})$/.exec(identity)
  return color ? { kind: 'user-color', name: color[1]! } : null
}
