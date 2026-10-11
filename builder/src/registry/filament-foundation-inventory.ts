import type { FoundationMapping } from '@/models/foundations.model'

export type FoundationInventoryEntry = {
  readonly id: string
  readonly compatibility: 'filament-5.9'
  readonly mapping: FoundationMapping
  readonly variable?: string
  readonly selector?: string
  readonly evidence: {
    readonly source: string
    readonly references: readonly string[]
  }
}

const BRIDGE_SOURCE = 'demo/resources/views/filament/preview-bridge.blade.php'
const RUNTIME_SOURCE = 'demo/storage/framework/views/compiled-filament-5.9-markup'

const VARIABLE_ENTRIES: readonly FoundationInventoryEntry[] = [
  {
    id: 'palette.primary.base',
    compatibility: 'filament-5.9',
    mapping: 'preview-emulatable',
    variable: '--ftb-primary',
    evidence: { source: BRIDGE_SOURCE, references: ['filament-5.9', 'ftb:theme:update', '--ftb-primary'] },
  },
  ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => ({
    id: `palette.primary.shades.${shade}`,
    compatibility: 'filament-5.9' as const,
    mapping: 'preview-emulatable' as const,
    variable: `--primary-${shade}`,
    evidence: { source: BRIDGE_SOURCE, references: ['filament-5.9', 'ftb:theme:update', `--primary-${shade}`] },
  })),
]

const SELECTOR_ENTRIES: readonly FoundationInventoryEntry[] = ([
  ['global.primary', '.fi-color-primary'],
  ['button.primary', '.fi-btn.fi-color-primary'],
  ['button.secondary', '.fi-btn.fi-outlined'],
  ['badge', '.fi-badge'],
  ['dropdown', '.fi-dropdown'],
  ['simple-header', '.fi-simple-header'],
  ['logo.light', '.fi-logo-light'],
  ['logo.dark', '.fi-logo-dark'],
 ] as const).map(([id, selector]) => ({
  id,
  compatibility: 'filament-5.9',
  mapping: 'export-only',
  selector,
  evidence: { source: RUNTIME_SOURCE, references: ['filament-5.9', `compiled markup ${selector}`] },
}))

function freezeEntry(entry: FoundationInventoryEntry): FoundationInventoryEntry {
  return Object.freeze({
    ...entry,
    evidence: Object.freeze({
      ...entry.evidence,
      references: Object.freeze([...entry.evidence.references]),
    }),
  })
}

export const FILAMENT_FOUNDATION_INVENTORY: readonly FoundationInventoryEntry[] = Object.freeze(
  [...VARIABLE_ENTRIES, ...SELECTOR_ENTRIES].map(freezeEntry)
)

export function lookupFoundationMapping(id: string): FoundationInventoryEntry | undefined {
  return FILAMENT_FOUNDATION_INVENTORY.find((entry) => entry.id === id)
}
