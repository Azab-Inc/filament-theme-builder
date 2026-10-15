import type { Ref } from 'vue'

import type { ThemeMode } from '@/models/foundations.model'
import type { PreviewThemeStore } from '@/models/preview-theme-store.model'

export type UsePreviewThemeOptions = {
  theme: PreviewThemeStore
  activeMode: Ref<ThemeMode>
  previewUrl: string
  iframe: Ref<HTMLIFrameElement | undefined>
  onPreviewLoad?: () => void
}
