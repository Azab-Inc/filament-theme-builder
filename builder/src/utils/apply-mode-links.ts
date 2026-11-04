import type { ThemeStateCurrent, ThemeValue } from '@/models/theme.model'
import type { ModeLinkMap } from '@/models/theme-mode-link.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import { resetModeLinkTarget, writeModeLinkTarget } from '@/utils/mode-link-targets'
import { createThemeRegistry } from '@/registry/theme-registry'
import { resolveLinkedColorValue } from '@/utils/resolve-linked-color-value'
import { readStoredModeLinkValue, legacyModeLinkTarget } from '@/utils/mode-link-stored-values'
import { normalizeModeLinkIdentities } from '@/utils/normalize-mode-links'

const registry = createThemeRegistry()
type Pair = { light?: ThemeValue; dark?: ThemeValue }

export function applyModeLinks(previous: ThemeStateCurrent, candidate: ThemeStateCurrent): ThemeStateCurrent {
  Object.assign(candidate, JSON.parse(JSON.stringify(candidate)) as ThemeStateCurrent)
  candidate.modeLinks = normalizeModeLinkIdentities(candidate.modeLinks ?? {})
  for (const [identity, link] of Object.entries(candidate.modeLinks ?? {})) {
    const target = link.target ?? legacyModeLinkTarget(identity)
    if (!target) continue
    const before = pair(previous, target)
    const after = pair(candidate, target)
    if (!before || !after) continue
    const lightChanged = after.light !== before.light
    const darkChanged = after.dark !== before.dark
    if (!lightChanged && !darkChanged) continue
    if (['raw', 'semantic', 'palette-base', 'palette-shade'].includes(target.kind) && ((lightChanged && after.light === undefined) || (darkChanged && after.dark === undefined))) {
      resetModeLinkTarget(candidate, target)
      delete candidate.modeLinks?.[identity]
      continue
    }
    const mode = darkChanged && !lightChanged ? 'dark' : 'light'
    const selected = mode === 'dark' ? after.dark : after.light
    const value = resolveLinkedColorValue(candidate, selected, mode)
    if (value === undefined || !writeModeLinkTarget(candidate, target, value, 'light', registry)) continue
    link.target = target
    link.value = value
  }
  return candidate
}

export function cloneModeLinks(value: ModeLinkMap | undefined): ModeLinkMap {
  return JSON.parse(JSON.stringify(value ?? {})) as ModeLinkMap
}

function pair(state: ThemeStateCurrent, target: ModeLinkTarget): Pair | null {
  const light = readStoredModeLinkValue(state, target, 'light')
  const dark = readStoredModeLinkValue(state, target, 'dark')
  return { light, dark }
}
