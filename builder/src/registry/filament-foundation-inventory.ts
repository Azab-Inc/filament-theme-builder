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
const ABSENT = ['No verified Filament 5.9 selector or variable is present for this semantic control.'] as const

function entry(id: string, mapping: FoundationMapping, options: Partial<Pick<FoundationInventoryEntry, 'variable' | 'selector'>> = {}): FoundationInventoryEntry {
  const preview = mapping === 'preview-emulatable'
  const absenceReason = id === 'density'
    ? 'No verified Filament density spacing/sidebar variable or rule is present in the committed runtime CSS.'
    : id === 'surface.page'
      ? 'No verified Filament page surface selector or variable is present in the committed runtime CSS.'
      : 'No verified Filament 5.9 selector or variable is present for this semantic control.'
  return {
    id,
    compatibility: 'filament-5.9',
    mapping,
    ...options,
    evidence: {
      source: BRIDGE_SOURCE,
      baseline: BASELINE_SOURCE,
      needle: preview
        ? (options.variable?.startsWith('--primary-') ? '--primary-${shade}' : options.variable ?? options.selector ?? '')
        : 'ftb:theme:update',
      reason: preview
        ? options.selector === '.fi-ta'
          ? 'The preview bridge emits this exact native Filament table density selector contract.'
          : 'The preview bridge emits this exact application-owned variable.'
        : absenceReason,
      ...(preview ? {} : { absent: ABSENT }),
    },
  }
}

const PALETTE_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const PALETTE_NAMES = ['primary', 'success', 'warning', 'danger', 'info', 'gray'] as const

const CONTROL_ENTRIES: FoundationInventoryEntry[] = PALETTE_NAMES.flatMap((palette) => [
  entry(`palette.${palette}.base`, palette === 'primary' ? 'preview-emulatable' : 'export-only', palette === 'primary' ? { variable: '--ftb-primary' } : {}),
  ...PALETTE_SHADES.map((shade) => entry(
    `palette.${palette}.shades.${shade}`,
    palette === 'primary' ? 'preview-emulatable' : 'export-only',
    palette === 'primary' ? { variable: `--primary-${shade}` } : {},
  )),
])

CONTROL_ENTRIES.push(
  ...(['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const).map((name) => entry(`surface.${name}`, 'unmapped')),
  ...(['default', 'strong'] as const).map((name) => entry(`border.${name}`, 'export-only')),
  ...(['primary', 'muted', 'disabled'] as const).map((name) => entry(`text.${name}`, 'export-only')),
  entry('typography.body', 'runtime-refresh-required'),
  entry('typography.heading', 'runtime-refresh-required'),
  entry('typography.mono', 'runtime-refresh-required'),
  ...['0', 'px', '0.5', '1', '1.5', '2', '3', '4', '6', '8'].map((key) => entry(`spacing.${key}`, 'unmapped')),
  entry('density', 'preview-emulatable', { selector: '.fi-ta' }),
  entry('radius', 'unmapped'),
  entry('borderWidth', 'unmapped'),
  entry('shadow', 'unmapped'),
)

const VERIFIED_SELECTOR_ENTRIES: FoundationInventoryEntry[] = ([
  ['global.primary', '.fi-color-primary', REGISTRY_SOURCE],
  ['button.primary', '.fi-btn.fi-color-primary', REGISTRY_SOURCE],
  ['button.secondary', '.fi-btn.fi-outlined', REGISTRY_SOURCE],
  ['badge', '.fi-badge', E2E_SOURCE],
  ['logo.light', '.fi-logo-light', BRANDING_SOURCE, 'fi-logo-light'],
  ['logo.dark', '.fi-logo-dark', BRANDING_SOURCE, 'fi-logo-dark'],
 ] as readonly (readonly [string, string, string, string?])[]).map(([id, selector, source, needle = selector]) => ({
  id,
  compatibility: 'filament-5.9' as const,
  mapping: 'export-only' as const,
  selector,
  evidence: {
    source,
    baseline: BASELINE_SOURCE,
    needle,
    reason: `The tracked runtime test/source records ${selector}; it is not a foundation preview target.`,
    absent: ABSENT,
  },
}))

function freezeEntry(value: FoundationInventoryEntry): FoundationInventoryEntry {
  return Object.freeze({ ...value, evidence: Object.freeze({ ...value.evidence }) })
}

export const FILAMENT_FOUNDATION_INVENTORY: readonly FoundationInventoryEntry[] = Object.freeze(
  [...CONTROL_ENTRIES, ...VERIFIED_SELECTOR_ENTRIES].map(freezeEntry),
)

export function lookupFoundationMapping(id: string): FoundationInventoryEntry | undefined {
  return FILAMENT_FOUNDATION_INVENTORY.find((entry) => entry.id === id)
}
