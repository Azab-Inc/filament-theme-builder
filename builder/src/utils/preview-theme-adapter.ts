import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateV4, ThemeStateV5 } from '@/models/theme.model'
import { validateFoundationState } from '@/utils/foundation-validation'

export function toLegacyPreviewTheme(state: ThemeStateV5, registry: FilamentRegistry): ThemeStateV4 {
  const validation = validateFoundationState(state, registry)
  if (!validation.valid) throw new Error(`Cannot send invalid preview theme: ${validation.message}`)
  const { padding: _padding, schemaVersion: _schemaVersion, ...legacy } = structuredClone(state)
  return { ...legacy, schemaVersion: 4 }
}
