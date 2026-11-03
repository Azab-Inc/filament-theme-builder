import type { ThemeMode } from '@/models/foundations.model'
import { toRaw } from 'vue'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import type { ModeLinkBinding } from '@/models/mode-link-control.model'
import type { ModeLinkTarget, ModeLinkToggleResult } from '@/models/mode-link-target.model'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'
import { readModeLinkTarget, writeModeLinkTarget } from '@/utils/mode-link-targets'
import { resolveLinkedColorValue } from '@/utils/resolve-linked-color-value'

export function useThemeModeLinkActions(context: ThemeStoreContext) {
  const commit = context.commit ?? ((candidate: typeof context.theme.value) => { context.theme.value = candidate })
  function isModeLinked(identity: string): boolean { return context.theme.value.modeLinks?.[identity]?.linked === true }
  function unlinkMode(identity: string): void { if (!isModeLinked(identity)) return; const candidate = JSON.parse(JSON.stringify(toRaw(context.theme.value))) as typeof context.theme.value; delete candidate.modeLinks?.[identity]; commit(candidate) }
  function linkModeTarget(target: ModeLinkTarget, activeMode: ThemeMode, decision: 'cancel' | 'replace' | 'keep' = 'keep'): ModeLinkToggleResult {
    if (decision === 'cancel') return { ok: false, requiresConfirmation: false }
    const identity = modeLinkTargetIdentity(target)
    const state = context.theme.value
    const effective = (mode: ThemeMode) => resolveLinkedColorValue(state, readModeLinkTarget(state, target, mode, context.registry), mode)
    const active = effective(activeMode)
    const other = effective(activeMode === 'light' ? 'dark' : 'light')
    if (active === undefined || active === '') return { ok: false, requiresConfirmation: false, error: 'Target has no current value.' }
    if (decision === 'keep' && other !== undefined && other !== active) return { ok: false, requiresConfirmation: true }
    const candidate = JSON.parse(JSON.stringify(toRaw(state))) as typeof state
    if (!writeModeLinkTarget(candidate, target, active, activeMode, context.registry)) return { ok: false, requiresConfirmation: false, error: 'Target is invalid or unavailable.' }
    candidate.modeLinks = { ...(candidate.modeLinks ?? {}), [identity]: { identity, value: active, linked: true, target } }
    commit(candidate)
    return { ok: true, requiresConfirmation: false }
  }
  function toggleModeTargetInteractive(target: ModeLinkTarget, activeMode: ThemeMode): void {
    const identity = modeLinkTargetIdentity(target)
    if (isModeLinked(identity)) { unlinkMode(identity); return }
    const first = linkModeTarget(target, activeMode, 'keep')
    if (first.requiresConfirmation && window.confirm('Replace the other mode with the active value?')) linkModeTarget(target, activeMode, 'replace')
  }
  function bindingForModeTarget(target: ModeLinkTarget, activeMode: ThemeMode): ModeLinkBinding {
    const identity = modeLinkTargetIdentity(target)
    const value = readModeLinkTarget(context.theme.value, target, activeMode, context.registry)
    const label = target.kind === 'raw' ? `${target.property} (${target.selector})` : target.kind === 'semantic' ? `${target.targetId} ${target.controlId} ${target.scope} ${target.stateId ?? ''}` : target.kind === 'foundation' ? target.path : `${target.name} ${target.kind}${'shade' in target ? ` ${target.shade}` : ''}`
    return { identity, label, linked: isModeLinked(identity), disabled: value === undefined || value === '', toggle: () => toggleModeTargetInteractive(target, activeMode) }
  }
  return { isModeLinked, unlinkMode, linkModeTarget, toggleModeTargetInteractive, bindingForModeTarget }
}
