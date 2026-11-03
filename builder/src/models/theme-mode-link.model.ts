import type { ThemeValue } from '@/models/theme.model'
import type { ThemeMode } from '@/models/foundations.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'

export type ModeLinkIdentity = string
export type ModeLink = { identity: ModeLinkIdentity; value: ThemeValue; linked: true; target?: ModeLinkTarget }
export type ModeLinkMap = Record<ModeLinkIdentity, ModeLink>
export type ModeValues = { light: ThemeValue; dark: ThemeValue }
export type ModeLinkDecision = 'cancel' | 'replace' | 'keep'
export type ModeLinkResult = { values: ModeValues; link: ModeLink; requiresConfirmation: boolean }
export type ActiveModeValue = { mode: ThemeMode; value: ThemeValue }
