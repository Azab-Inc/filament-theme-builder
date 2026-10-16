import { beforeEach, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import type { ResolveRequest, ThemeOverride } from '@/models/theme.model'
import { useThemeStore } from '@/stores/theme'
import { themeStateKey } from '@/utils/local-theme-storage'

export const createThemeState = useThemeStore
export const readActiveThemeState = (): unknown => {
  const id = localStorage.getItem('ftb-theme-active')
  return id ? JSON.parse(localStorage.getItem(themeStateKey(id))!) as unknown : null
}
export const primaryButtonVariantRequest: ResolveRequest = { targetId: 'global.primary', controlId: 'primary' }
export const primaryButtonVariantOverride: ThemeOverride = {
  targetId: 'global.primary',
  controlId: 'primary',
  scope: 'global',
  value: '#4f46e5',
}
export const invalidExternalOverride = {
  targetId: 'button.primary',
  controlId: 'background',
  scope: 'state',
  componentId: 'button',
  variantId: 'primary',
  stateId: 'hover',
  value: 'not-a-color',
}

export const setupThemeStateTest = () => {
  localStorage.clear()
  vi.useRealTimers()
  setActivePinia(createPinia())
}

export const resetThemeStateTest = () => {
  beforeEach(setupThemeStateTest)
}
