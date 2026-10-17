import type { ThemeStateV4 } from '@/models/theme.model'
import type { Ref } from 'vue'

export type LocalThemeRecord = {
  id: string
  name: string
  updatedAt: number
}

export type LocalThemeHistory = {
  snapshots: ThemeStateV4[]
  cursor: number
}

export type LocalThemeCollection = {
  themes: LocalThemeRecord[]
  activeId: string
}

export type StorageOperationResult = { ok: true } | { ok: false; error: string }

export type LocalThemeLoadResult = {
  collection: LocalThemeCollection
  state: ThemeStateV4
  history: LocalThemeHistory
  error: string | null
}


export type LocalThemePendingSave = {
  state: ThemeStateV4
  history: LocalThemeHistory
  timer: ReturnType<typeof setTimeout>
}

export type LocalThemeRecoveredRecords = {
  records: LocalThemeRecord[]
  values: Map<string, { state: ThemeStateV4; history: LocalThemeHistory }>
  repaired: boolean
  repairError: string | null
}

export type LocalThemePersistenceOptions = {
  storage: Storage
  initialState: ThemeStateV4
  now: () => number
  schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  cancel: (handle: ReturnType<typeof setTimeout>) => void
}

export type LocalThemePersistence = {
  themes: Ref<LocalThemeRecord[]>
  activeThemeId: Ref<string>
  activeState: Ref<ThemeStateV4>
  activeHistory: Ref<LocalThemeHistory>
  storageError: Readonly<Ref<string | null>>
}
