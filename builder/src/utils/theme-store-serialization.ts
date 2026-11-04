import type { ThemeStateCurrent } from '@/models/theme.model'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function serializeTheme(value: ThemeStateCurrent): ThemeStateCurrent {
  const serialized = cloneTheme(value)
  if (serialized.schemaVersion === 7) return serialized
  for (const palette of Object.values(serialized.foundations.palettes)) {
    delete (palette as { shades?: Partial<Record<number, string>> }).shades
  }
  return serialized
}
