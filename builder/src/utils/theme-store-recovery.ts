import type { ThemeStateV5 } from '@/models/theme.model'
import { validateFoundationState } from '@/utils/foundation-validation'
import { recoverVersionedTheme } from '@/utils/theme-import-migrations'
import { isLegacyVersionThree, isVersionFour, normalizeTheme } from '@/utils/theme-store-normalization'

export function recoverLegacyState(value: unknown): ThemeStateV5 | null {
  if (!isLegacyVersionThree(value) && !isVersionFour(value)) return null
  try {
    const recovered = normalizeTheme(recoverVersionedTheme(value))
    return validateFoundationState(recovered.foundations).valid ? recovered : null
  } catch {
    return null
  }
}
