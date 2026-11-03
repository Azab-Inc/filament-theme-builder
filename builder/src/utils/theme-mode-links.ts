import type { ThemeValue } from '@/models/theme.model'
import type { ThemeMode } from '@/models/foundations.model'
import type { ModeLink, ModeLinkDecision, ModeLinkResult, ModeValues } from '@/models/theme-mode-link.model'

export function linkModes(identity: string, active: { mode: ThemeMode; value: ThemeValue }, values: ModeValues, decision: ModeLinkDecision = 'keep'): ModeLinkResult | null {
  const other = active.mode === 'light' ? values.dark : values.light
  const differs = other !== active.value
  if (differs && decision === 'cancel') return null
  if (differs && decision === 'keep') return { values, link: { identity, value: active.value, linked: true }, requiresConfirmation: true }
  return { values: { light: active.value, dark: active.value }, link: { identity, value: active.value, linked: true }, requiresConfirmation: false }
}

export function applyLinkedValue(link: ModeLink | undefined, values: ModeValues, mode: ThemeMode, value: ThemeValue): ModeValues {
  if (!link?.linked) return { ...values, [mode]: value }
  return { light: value, dark: value }
}

export function unlockModes(link: ModeLink | undefined, values: ModeValues): { values: ModeValues; link: undefined } {
  return link?.linked ? { values: { light: values.light, dark: values.dark }, link: undefined } : { values, link: undefined }
}
