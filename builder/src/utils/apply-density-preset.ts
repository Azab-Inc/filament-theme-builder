import type { Density, FoundationState } from '@/models/foundations.model'
import { clearExplicitPath } from '@/utils/foundation-provenance'
import { densityPreset } from '@/utils/foundation-defaults'

export function applyDensityPreset<T extends FoundationState>(foundations: T, value: Density): T {
  const candidate: T = structuredClone(foundations)
  const preset: ReturnType<typeof densityPreset> = densityPreset(value)
  candidate.density = value
  Object.assign(candidate.spacing, preset.spacing)
  Object.keys(preset.spacing).forEach((key: string): void => clearExplicitPath(candidate, `spacing.${key}`))
  return candidate
}
