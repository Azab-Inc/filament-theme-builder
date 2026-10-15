import type { RegistryEntry } from '@/models/theme-registry.model'
import { SUPPORTED_PSEUDO_STATES } from '@/models/theme-registry.model'
import { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry-catalog-constants'

const primaryButton: RegistryEntry = {
  id: 'button.primary',
  label: 'Primary button',
  family: 'button',
  selectors: ['.fi-btn.fi-color-primary'],
  controls: [
    {
      id: 'background',
      valueType: 'color',
      constraints: { pattern: /^#[\da-f]{6}$/i },
      defaultValue: '#6366f1',
      globalValue: 'primary',
    },
  ],
  variants: ['primary', 'secondary'],
  states: ['default', ...SUPPORTED_PSEUDO_STATES.slice(0, 1)],
  filamentCompatibility: SUPPORTED_FILAMENT_COMPATIBILITY,
}

const secondaryButton: RegistryEntry = {
  ...primaryButton,
  id: 'button.secondary',
  label: 'Secondary button',
  selectors: ['.fi-btn.fi-outlined'],
}

const legacyPrimary: RegistryEntry = {
  id: 'global.primary',
  label: 'Primary color',
  family: 'global',
  selectors: ['.fi-color-primary'],
  controls: [
    {
      id: 'primary',
      valueType: 'color',
      constraints: { pattern: /^#[\da-f]{6}$/i },
      defaultValue: '#6366f1',
      globalValue: 'primary',
    },
  ],
  variants: [],
  states: [],
  filamentCompatibility: SUPPORTED_FILAMENT_COMPATIBILITY,
}

const productNameInput: RegistryEntry = {
  id: 'form.product-name',
  label: 'Product name input',
  family: 'form',
  selectors: ['.fi-fo-text-input .fi-input'],
  controls: [
    {
      id: 'background',
      valueType: 'color',
      constraints: { pattern: /^#[\da-f]{6}$/i },
    },
  ],
  variants: ['default'],
  states: [SUPPORTED_PSEUDO_STATES[1]],
  filamentCompatibility: SUPPORTED_FILAMENT_COMPATIBILITY,
}

export const coreRegistryEntries: readonly RegistryEntry[] = [
  primaryButton,
  secondaryButton,
  legacyPrimary,
  productNameInput,
]
