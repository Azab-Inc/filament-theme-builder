import type { Density, DensityPreset, PaletteName } from '@/models/foundations.model'

export const PALETTE_BASES: Record<PaletteName, string> = {
  primary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray: '#6b7280',
}

export const SYSTEM_BODY_FONT = Object.freeze({
  kind: 'system' as const,
  name: 'System',
  family: 'ui-sans-serif, system-ui, sans-serif',
})

export const SYSTEM_HEADING_FONT = Object.freeze({
  kind: 'system' as const,
  name: 'System',
  family: 'ui-sans-serif, system-ui, sans-serif',
})

export const SYSTEM_MONO_FONT = Object.freeze({
  kind: 'system' as const,
  name: 'System Mono',
  family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
})

export const DENSITY_PRESETS: Record<Density, DensityPreset> = deepFreeze({
  compact: { controlHeight: 32, spacing: { '1': 4, '2': 6, '3': 8, '4': 12 } },
  default: { controlHeight: 40, spacing: { '1': 4, '2': 8, '3': 12, '4': 16 } },
  spacious: { controlHeight: 48, spacing: { '1': 6, '2': 12, '3': 16, '4': 24 } },
})

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }

  return value
}
