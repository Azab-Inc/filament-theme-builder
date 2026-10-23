import type { ThemeStateV5 } from '@/models/theme.model'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function serializeTheme(value: ThemeStateV5): ThemeStateV5 {
  const serialized = cloneTheme(value)
  for (const palette of Object.values(serialized.foundations.palettes)) {
    delete (palette as { shades?: Partial<Record<number, string>> }).shades
  }
  return serialized
}
