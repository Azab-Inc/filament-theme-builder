import type {
  FoundationMapping,
  FoundationRuntimeProperty,
} from '@/models/foundations.model'

export type FoundationInventoryEntry = {
  readonly id: string
  readonly compatibility: 'filament-5.9'
  readonly mapping: FoundationMapping
  readonly property: FoundationRuntimeProperty
  readonly variable?: string
  readonly selectors: readonly string[]
  readonly evidence: {
    readonly source: string
    readonly baseline: string
    readonly needle: string
    readonly reason: string
  }
}

const FOUNDATION_E2E_SOURCE = 'e2e/theme-foundations.spec.ts'
const BASELINE_SOURCE = 'demo/composer.json'
const PALETTE_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const PALETTE_NAMES = ['primary', 'success', 'warning', 'danger', 'info', 'gray'] as const
const SURFACE_SELECTORS = {
  page: ['html', 'body'],
  sidebar: ['.fi-sidebar'],
  topbar: ['.fi-topbar'],
  card: ['.fi-section', '.fi-ta-ctn', '.fi-wi-stats-overview-stat'],
  elevated: ['.fi-modal', '.fi-dropdown'],
  input: ['.fi-input', '.fi-select-input', '.fi-fo-textarea'],
} as const
const BORDER_SELECTORS = {
  default: ['.fi-section', '.fi-ta-ctn', '.fi-input', '.fi-select-input', '.fi-fo-textarea'],
  strong: ['.fi-btn.fi-outlined', '.fi-section-header', '.fi-ta-header'],
} as const
const TEXT_SELECTORS = {
  primary: ['body', '.fi-body', '.fi-in-text', '.fi-fo-field-label'],
  muted: ['.fi-section-header-description', '.fi-fo-field-label-help', '.fi-in-text-description'],
  disabled: [':disabled', '[disabled]', '.fi-disabled'],
} as const
const TYPOGRAPHY_SELECTORS = {
  body: ['body', '.fi-body', '.fi-btn', '.fi-input', '.fi-select-input', '.fi-fo-textarea'],
  heading: ['h1', 'h2', 'h3', 'h4', '.fi-header-heading', '.fi-section-header-heading', '.fi-ta-header-heading'],
  mono: ['code', 'pre', '.fi-in-key-value'],
} as const
const SPACING_SELECTORS = [
  ['0', ['.fi-sidebar']], ['px', ['.fi-topbar']], ['0.5', ['.fi-btn']], ['1', ['.fi-input', '.fi-select-input']],
  ['1.5', ['.fi-section-header']], ['2', ['.fi-section']], ['3', ['.fi-ta-header']], ['4', ['.fi-ta-ctn']],
  ['6', ['.fi-modal']], ['8', ['.fi-page']],
] as const
const COMPONENT_SELECTORS = ['.fi-section', '.fi-ta', '.fi-ta-ctn', '.fi-btn', '.fi-input', '.fi-select-input', '.fi-fo-textarea', '.fi-modal'] as const

function entry(
  id: string,
  property: FoundationRuntimeProperty,
  selectors: readonly string[],
  options: { variable?: string; mapping?: FoundationMapping } = {},
): FoundationInventoryEntry {
  const mapping = options.mapping ?? (property === 'color' || property === 'fontFamily' ? 'preview-emulatable' : 'live-emulation')
  return {
    id,
    compatibility: 'filament-5.9',
    mapping,
    property,
    selectors,
    ...(options.variable === undefined ? {} : { variable: options.variable }),
    evidence: {
      source: FOUNDATION_E2E_SOURCE,
      baseline: BASELINE_SOURCE,
      needle: 'projects every foundation family live in the iframe without reload',
      reason: `The iframe integration test validates live foundation projections against the Filament 5.9 runtime; the bridge restricts ${id} to fixed selectors: ${selectors.join(', ')}.`,
    },
  }
}

const CONTROL_ENTRIES: FoundationInventoryEntry[] = PALETTE_NAMES.flatMap((palette) => [
  entry(`palette.${palette}.base`, 'color', [`.fi-color-${palette}`, `.fi-btn.fi-color-${palette}`], { variable: `--ftb-${palette}` }),
  ...PALETTE_SHADES.map((shade) => entry(`palette.${palette}.shades.${shade}`, 'color', [`.fi-color-${palette}`, `.fi-btn.fi-color-${palette}`], { variable: `--${palette}-${shade}` })),
])

CONTROL_ENTRIES.push(
  ...Object.entries(SURFACE_SELECTORS).map(([name, selectors]) => entry(`surface.${name}`, 'color', selectors)),
  ...Object.entries(BORDER_SELECTORS).map(([name, selectors]) => entry(`border.${name}`, 'color', selectors)),
  ...Object.entries(TEXT_SELECTORS).map(([name, selectors]) => entry(`text.${name}`, 'color', selectors)),
  ...Object.entries(TYPOGRAPHY_SELECTORS).map(([name, selectors]) => entry(`typography.${name}`, 'fontFamily', selectors)),
  ...SPACING_SELECTORS.map(([key, selectors]) => entry(`spacing.${key}`, 'spacing', selectors)),
  entry('density', 'density', COMPONENT_SELECTORS),
  entry('radius', 'radius', COMPONENT_SELECTORS),
  entry('borderWidth', 'borderWidth', COMPONENT_SELECTORS),
  entry('shadow', 'shadow', COMPONENT_SELECTORS),
)

export const FILAMENT_FOUNDATION_INVENTORY: readonly FoundationInventoryEntry[] = Object.freeze(
  CONTROL_ENTRIES.map((value) => Object.freeze({ ...value, selectors: Object.freeze([...value.selectors]), evidence: Object.freeze({ ...value.evidence }) })),
)

export function lookupFoundationMapping(id: string): FoundationInventoryEntry | undefined {
  return FILAMENT_FOUNDATION_INVENTORY.find((entry) => entry.id === id)
}
