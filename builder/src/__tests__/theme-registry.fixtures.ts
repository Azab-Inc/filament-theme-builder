import type { RegistryEntry } from '@/models/theme-registry.model'
import { validateRegistry } from '@/registry/theme-registry'

export const backgroundControl = {
  id: 'background',
  valueType: 'color' as const,
  constraints: { pattern: /^#[\da-f]{6}$/i },
}

export const buttonEntry: RegistryEntry = {
  id: 'button.primary',
  label: 'Primary button',
  family: 'button',
  selectors: ['.fi-btn-primary'],
  controls: [backgroundControl],
  variants: ['primary', 'secondary'],
  states: ['default', 'hover'],
  filamentCompatibility: '5.x',
}

export function createTestRegistry() {
  return validateRegistry([
    { ...buttonEntry, selectors: ['.fi-shared'] },
    { ...buttonEntry, id: 'button.secondary', label: 'Secondary button', selectors: ['.fi-shared'] },
  ])
}
