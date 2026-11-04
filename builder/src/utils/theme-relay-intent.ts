import { ref } from 'vue'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { ThemeRelayIntent } from '@/models/theme-relay-intent.model'
import type { ThemeStateCurrent, ThemeValue } from '@/models/theme.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { useThemeFoundationActions } from '@/composables/use-theme-foundation-actions'
import { useThemePaletteActions } from '@/composables/use-theme-palette-actions'
import { useThemeRawActions } from '@/composables/use-theme-raw-actions'
import { useThemeOverrideActions } from '@/composables/use-theme-override-actions'
import { useThemeUserTokens } from '@/composables/use-theme-user-tokens'
import { useThemeModeLinkActions } from '@/composables/use-theme-mode-link-actions'
import { validModeLinkTarget } from '@/utils/mode-link-target-validation'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'
import { validateRawSelector } from '@/utils/raw-override-validation'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { resetModeLinkTarget } from '@/utils/reset-mode-link-target'
import { ensureChanged, isModeTarget, isPaletteShade, isTokenMutationTarget, isTokenTarget, supportedTargetForAction } from '@/utils/theme-relay-intent-validation'

const actions = ['set', 'reset', 'link', 'unlink', 'create-color', 'create-palette', 'update', 'remove'] as const

export function parseThemeRelayIntent(value: string, registry?: FilamentRegistry): ThemeRelayIntent | null {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed) || parsed.schemaVersion !== 1 || parsed.kind !== 'theme-intent' || !isRecord(parsed.target) || !actions.includes(parsed.action as never)) return null
    const target = parsed.target as ThemeRelayIntent['target']
    if (!isTokenTarget(target) && registry && !validModeLinkTarget(target as ModeLinkTarget, registry)) return null
    if (!isTokenTarget(target) && target.kind === 'raw' && !validateRawSelector(target.selector).valid) return null
    if (!supportedTargetForAction(parsed.action as ThemeRelayIntent['action'], target)) return null
    if (parsed.mode !== undefined && parsed.mode !== 'light' && parsed.mode !== 'dark') return null
    if ('value' in parsed && !isValue(parsed.value)) return null
    return { schemaVersion: 1, kind: 'theme-intent', action: parsed.action as ThemeRelayIntent['action'], target, ...(parsed.mode ? { mode: parsed.mode } : {}), ...(parsed.value !== undefined ? { value: parsed.value as ThemeValue } : {}) }
  } catch { return null }
}

export function applyThemeRelayIntent(previous: ThemeStateCurrent, intent: ThemeRelayIntent, registry: FilamentRegistry): ThemeStateCurrent {
  if (!supportedTargetForAction(intent.action, intent.target)) throw new Error('invalid_intent')
  const theme = ref(cloneTheme(previous))
  const context: ThemeStoreContext = { theme, registry, commit: (candidate) => { theme.value = candidate } }
  const foundation = useThemeFoundationActions(context); const palette = useThemePaletteActions(context)
  const raw = useThemeRawActions(context); const override = useThemeOverrideActions(context)
  const tokens = useThemeUserTokens(context); const links = useThemeModeLinkActions(context)
  const mode = intent.mode ?? 'light'; const target = intent.target
  if (intent.action === 'create-color' || intent.action === 'create-palette') {
    if (!isTokenTarget(target) || target.name.length === 0 || typeof intent.value !== 'string') throw new Error('invalid_intent')
    const result = intent.action === 'create-color' ? tokens.createUserColor(target.name, intent.value) : tokens.createUserPalette(target.name, intent.value)
    if (!result.ok) throw new Error(result.error)
    return cloneTheme(theme.value)
  }
  if (intent.action === 'remove' || intent.action === 'update' || (intent.action === 'set' && isTokenMutationTarget(target))) {
    if (!isTokenMutationTarget(target) || (intent.action !== 'remove' && typeof intent.value !== 'string')) throw new Error('invalid_intent')
    const shade = 'shade' in target && isPaletteShade(target.shade) ? target.shade : undefined
    const result = intent.action === 'remove' ? tokens.removeUserToken(target.name) : tokens.updateUserToken(target.name, intent.value as string, mode, shade)
    if (!result.ok) throw new Error(result.error); return cloneTheme(theme.value)
  }
  if (!isModeTarget(target) || !validModeLinkTarget(target, registry)) throw new Error('invalid_target')
  const before = JSON.stringify(theme.value)
  if (intent.action === 'link') {
    if (intent.value !== undefined) setTarget(target, intent.value, mode, foundation, palette, raw, override)
    const result = links.linkModeTarget(target, mode, 'replace'); if (!result.ok) throw new Error(result.error ?? 'invalid_intent'); ensureChanged(before, theme.value); return cloneTheme(theme.value)
  }
  if (intent.action === 'unlink') { links.unlinkMode(modeLinkTargetIdentity(target)); ensureChanged(before, theme.value); return cloneTheme(theme.value) }
  if (intent.action === 'reset') { resetTarget(theme.value, target, mode, foundation, palette, raw, override); ensureChanged(before, theme.value); return cloneTheme(theme.value) }
  if (intent.value === undefined) throw new Error('missing_value')
  if (isTokenTarget(target)) {
    if (typeof intent.value !== 'string') throw new Error('invalid_value')
    const shade = 'shade' in target && isPaletteShade(target.shade) ? target.shade : undefined
    const result = tokens.updateUserToken(target.name, intent.value, mode, shade)
    if (!result.ok) throw new Error(result.error)
    return cloneTheme(theme.value)
  }
  setTarget(target, intent.value, mode, foundation, palette, raw, override)
  ensureChanged(before, theme.value)
  return cloneTheme(theme.value)
}

function setTarget(target: ModeLinkTarget, value: ThemeValue, mode: 'light' | 'dark', foundation: ReturnType<typeof useThemeFoundationActions>, palette: ReturnType<typeof useThemePaletteActions>, raw: ReturnType<typeof useThemeRawActions>, override: ReturnType<typeof useThemeOverrideActions>): void {
  if (target.kind === 'raw') return raw.setRawOverride(target.selector, target.property, String(value), mode)
  if (target.kind === 'semantic') {
    const { kind: _kind, ...semantic } = target
    return override.setOverride({ ...semantic, value, ...(mode === 'dark' ? { mode: 'dark' as const } : {}) })
  }
  if (target.kind === 'foundation') return foundation.setFoundation(`${target.path}.${mode}`, value)
  if (target.kind === 'palette-base') return palette.setPaletteBase(target.name, String(value), mode)
  if (target.kind === 'palette-shade') return palette.setPaletteShadeOverride(target.name, target.shade, String(value), mode)
  throw new Error('unsupported_intent_target')
}

function resetTarget(state: ThemeStateCurrent, target: ModeLinkTarget, mode: 'light' | 'dark', foundation: ReturnType<typeof useThemeFoundationActions>, palette: ReturnType<typeof useThemePaletteActions>, raw: ReturnType<typeof useThemeRawActions>, override: ReturnType<typeof useThemeOverrideActions>): void {
  const identity = modeLinkTargetIdentity(target)
  if (state.modeLinks?.[identity]?.linked) { resetModeLinkTarget(state, target); delete state.modeLinks[identity]; return }
  if (target.kind === 'raw') raw.resetRawProperty(target.selector, target.property, mode)
  else if (target.kind === 'semantic') override.resetOverride({ ...target, mode })
  else if (target.kind === 'foundation') foundation.resetFoundation(`${target.path}.${mode}`)
  else if (target.kind === 'palette-base') foundation.resetFoundation(`palettes.${target.name}.${mode === 'dark' ? 'dark.' : ''}base`)
  else if (target.kind === 'palette-shade') palette.resetPaletteShade(target.name, target.shade, mode)
  else throw new Error('unsupported_intent_target')
}

function isValue(value: unknown): value is ThemeValue { return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' }
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }
