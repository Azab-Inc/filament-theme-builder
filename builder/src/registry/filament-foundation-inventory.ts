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
    readonly reason: string
    readonly absent?: readonly string[]
  }
}

const BRIDGE_SOURCE = 'demo/resources/views/filament/preview-bridge.blade.php'
const REGISTRY_SOURCE = 'builder/src/registry/theme-registry.ts'
const E2E_SOURCE = 'e2e/demo-panel.spec.ts'
const BRANDING_SOURCE = 'demo/tests/Feature/Filament/PanelBrandingNavigationTest.php'
const BASELINE_SOURCE = 'demo/composer.json'

const VARIABLE_ENTRIES: readonly FoundationInventoryEntry[] = [
  {
    id: 'palette.primary.base',
    compatibility: 'filament-5.9',
    mapping: 'preview-emulatable',
    variable: '--ftb-primary',
    evidence: { source: BRIDGE_SOURCE, baseline: BASELINE_SOURCE, needle: '--ftb-primary', reason: 'The preview bridge emits this application-owned primary variable.' },
  },
  ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => ({
    id: `palette.primary.shades.${shade}`,
    compatibility: 'filament-5.9' as const,
    mapping: 'preview-emulatable' as const,
    variable: `--primary-${shade}`,
    evidence: { source: BRIDGE_SOURCE, baseline: BASELINE_SOURCE, needle: '--primary-${shade}', reason: 'The preview bridge emits this application-owned shade template.' },
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
  evidence: { source, baseline: BASELINE_SOURCE, needle, reason: `The tracked runtime test/source records ${selector}.` },
}))

const RUNTIME_ENTRIES: readonly FoundationInventoryEntry[] = [
  {
    id: 'density',
    compatibility: 'filament-5.9',
    mapping: 'unmapped',
    evidence: {
      source: 'demo/resources/css/app.css',
      baseline: BASELINE_SOURCE,
      needle: '@theme',
      absent: ['--spacing', '--sidebar-width', '--collapsed-sidebar-width'],
      reason: 'No verified Filament density variable or rule is present in the committed runtime CSS; density remains unmapped.',
    },
  },
  {
    id: 'surface.page',
    compatibility: 'filament-5.9',
    mapping: 'unmapped',
    evidence: {
      source: BRIDGE_SOURCE,
      baseline: BASELINE_SOURCE,
      needle: '--ftb-primary',
      reason: 'The bridge evidence is unrelated to page surfaces; no verified page surface selector or variable is available.',
    },
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
