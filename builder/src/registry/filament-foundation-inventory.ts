import type { FoundationMapping } from '@/models/foundations.model'

export type FoundationInventoryEntry = {
  readonly id: string
  readonly compatibility: 'filament-5.9'
  readonly mapping: FoundationMapping
  readonly variable?: string
  readonly selector?: string
  readonly evidence: {
    readonly source: string
    readonly baseline: string
    readonly needle: string
  }
}

const BRIDGE_SOURCE = 'demo/resources/views/filament/preview-bridge.blade.php'
const REGISTRY_SOURCE = 'builder/src/registry/theme-registry.ts'
const E2E_SOURCE = 'e2e/demo-panel.spec.ts'
const BRANDING_SOURCE = 'demo/tests/Feature/Filament/PanelBrandingNavigationTest.php'
const PANEL_SOURCE = 'demo/app/Providers/Filament/AdminPanelProvider.php'
const BASELINE_SOURCE = 'demo/composer.json'

const VARIABLE_ENTRIES: readonly FoundationInventoryEntry[] = [
  {
    id: 'palette.primary.base',
    compatibility: 'filament-5.9',
    mapping: 'preview-emulatable',
    variable: '--ftb-primary',
    evidence: { source: BRIDGE_SOURCE, baseline: BASELINE_SOURCE, needle: '--ftb-primary' },
  },
  ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => ({
    id: `palette.primary.shades.${shade}`,
    compatibility: 'filament-5.9' as const,
    mapping: 'preview-emulatable' as const,
    variable: `--primary-${shade}`,
    evidence: { source: BRIDGE_SOURCE, baseline: BASELINE_SOURCE, needle: '--primary-${shade}' },
  })),
]

const SELECTOR_ENTRIES: readonly FoundationInventoryEntry[] = ([
  ['global.primary', '.fi-color-primary', REGISTRY_SOURCE],
  ['button.primary', '.fi-btn.fi-color-primary', REGISTRY_SOURCE],
  ['button.secondary', '.fi-btn.fi-outlined', REGISTRY_SOURCE],
  ['badge', '.fi-badge', E2E_SOURCE],
  ['logo.light', '.fi-logo-light', BRANDING_SOURCE, 'fi-logo-light'],
  ['logo.dark', '.fi-logo-dark', BRANDING_SOURCE, 'fi-logo-dark'],
 ] as const).map(([id, selector, source, needle = selector]) => ({
  id,
  compatibility: 'filament-5.9',
  mapping: 'export-only',
  selector,
  evidence: { source, baseline: BASELINE_SOURCE, needle },
}))

const RUNTIME_ENTRIES: readonly FoundationInventoryEntry[] = [
  {
    id: 'density',
    compatibility: 'filament-5.9',
    mapping: 'runtime-refresh-required',
    evidence: { source: PANEL_SOURCE, baseline: BASELINE_SOURCE, needle: 'sidebarCollapsibleOnDesktop' },
  },
  {
    id: 'surface.page',
    compatibility: 'filament-5.9',
    mapping: 'unmapped',
    evidence: { source: BRIDGE_SOURCE, baseline: BASELINE_SOURCE, needle: '--ftb-primary' },
  },
]

function freezeEntry(entry: FoundationInventoryEntry): FoundationInventoryEntry {
  return Object.freeze({
    ...entry,
    evidence: Object.freeze({
      ...entry.evidence,
    }),
  })
}

export const FILAMENT_FOUNDATION_INVENTORY: readonly FoundationInventoryEntry[] = Object.freeze(
  [...VARIABLE_ENTRIES, ...SELECTOR_ENTRIES, ...RUNTIME_ENTRIES].map(freezeEntry)
)

export function lookupFoundationMapping(id: string): FoundationInventoryEntry | undefined {
  return FILAMENT_FOUNDATION_INVENTORY.find((entry) => entry.id === id)
}
