import type { ThemeStateInput, ThemeStateV5 } from '@/models/theme.model'
import type { Ref } from 'vue'

export type LocalThemeRecord = {
  id: string
  name: string
  updatedAt: number
}

export type LocalThemeHistory = {
  snapshots: ThemeStateV5[]
  cursor: number
}
export type LocalThemeHistoryInput = { snapshots: ThemeStateInput[]; cursor: number }

export type LocalThemeCollection = {
  themes: LocalThemeRecord[]
  activeId: string
}

export type StorageOperationResult = { ok: true } | {
  ok: false
  error: string
  rollbackFailed?: boolean
  unrestoredKeys?: string[]
}

export type LocalThemeLoadResult = {
  collection: LocalThemeCollection
  state: ThemeStateV5
  history: LocalThemeHistory
  error: string | null
}


export type LocalThemePendingSave = {
  state: ThemeStateV5
  history: LocalThemeHistory
  timer: ReturnType<typeof setTimeout>
}

export type LocalThemeRecoveredRecords = {
  records: LocalThemeRecord[]
  values: Map<string, { state: ThemeStateV5; history: LocalThemeHistory }>
  repaired: boolean
  repairError: string | null
}

export type LocalThemePersistenceOptions = {
  storage: Storage
  initialState: ThemeStateInput
  now: () => number
  schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  cancel: (handle: ReturnType<typeof setTimeout>) => void
}

export type LocalThemePersistence = {
  themes: Ref<LocalThemeRecord[]>
  activeThemeId: Ref<string>
  activeState: Ref<ThemeStateV5>
  activeHistory: Ref<LocalThemeHistory>
  storageError: Readonly<Ref<string | null>>
}
