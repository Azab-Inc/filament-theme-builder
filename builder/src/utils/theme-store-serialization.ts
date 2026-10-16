import type { ThemeStateV4 } from '@/models/theme.model'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function serializeTheme(value: ThemeStateV4): ThemeStateV4 {
  const serialized = cloneTheme(value)
  for (const palette of Object.values(serialized.foundations.palettes)) {
    delete (palette as { shades?: Partial<Record<number, string>> }).shades
  }
  return serialized
}
