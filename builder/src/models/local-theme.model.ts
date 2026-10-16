import type { ThemeStateV4 } from '@/models/theme.model'

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
