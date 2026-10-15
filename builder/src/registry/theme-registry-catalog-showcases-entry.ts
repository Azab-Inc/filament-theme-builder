import type { RegistryEntry } from '@/models/theme-registry.model'
import { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry-catalog-constants'

export function showcaseEntry(
  id: string,
  label: string,
  family: string,
  selectors: readonly string[],
  variants: readonly string[],
  states: readonly string[],
): RegistryEntry {
  return {
    id,
    label,
    family,
    selectors,
    controls: [],
    variants,
    states,
    filamentCompatibility: SUPPORTED_FILAMENT_COMPATIBILITY,
  }
}
