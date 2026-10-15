import type { useThemeStore } from '@/stores/theme'

export type PreviewThemeStore = Pick<ReturnType<typeof useThemeStore>, 'theme' | 'previewFoundation'>
