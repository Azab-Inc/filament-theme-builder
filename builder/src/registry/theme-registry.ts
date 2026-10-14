import type {
  FilamentRegistry,
  RegistryControl,
  RegistryEntry,
  RegistryLookupEvidence,
  RegistryLookupResult,
  RegistryValueType,
} from '@/models/theme-registry.model'
import type { InspectorResolution, InspectorTargetEvidence } from '@/services/inspector-protocol'
import { resolveInspectorTarget as resolveInspectorTargetFromEvidence } from '@/services/inspector-protocol'

const valueTypes: readonly RegistryValueType[] = ['boolean', 'color', 'number', 'string']
const compatibilityPattern = /^(\d+)\.x$/
const versionPattern = /^(\d+)(?:\.\d+){0,2}$/
export const SUPPORTED_FILAMENT_COMPATIBILITY = '5.x'

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
  states: ['default', 'hover'],
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

function formEntry(id: string, label: string, selectors: readonly string[]): RegistryEntry {
  return {
    id,
    label,
    family: 'form',
    selectors,
    controls: [],
    variants: [],
    states: [],
    filamentCompatibility: SUPPORTED_FILAMENT_COMPATIBILITY,
  }
}

function infolistEntry(id: string, label: string, selectors: readonly string[]): RegistryEntry {
  return { ...formEntry(id, label, selectors), family: 'infolist' }
}

function showcaseEntry(
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
  states: ['focus'],
  filamentCompatibility: SUPPORTED_FILAMENT_COMPATIBILITY,
}

const formEntries: readonly RegistryEntry[] = [
  formEntry('form.control.builder', 'Builder control', ['.fi-fo-builder']),
  formEntry('form.control.checkbox', 'Checkbox control', ['.fi-checkbox-input']),
  formEntry('form.control.checkbox-list', 'Checkbox list control', ['.fi-fo-checkbox-list']),
  formEntry('form.control.code-editor', 'Code editor control', ['.fi-fo-code-editor']),
  formEntry('form.control.color-picker', 'Color picker control', ['.fi-fo-color-picker']),
  formEntry('form.control.date', 'Date control', ['.fi-fo-date-time-picker']),
  formEntry('form.control.file-upload', 'File upload control', ['.fi-fo-file-upload']),
  formEntry('form.control.key-value', 'Key-value control', ['.fi-fo-key-value']),
  formEntry('form.control.markdown-editor', 'Markdown editor control', ['.fi-fo-markdown-editor']),
  formEntry('form.control.modal-table-select', 'Modal table select control', ['.fi-fo-modal-table-select']),
  formEntry('form.control.one-time-code', 'One-time code control', ['.fi-one-time-code-input-ctn']),
  formEntry('form.control.radio', 'Radio control', ['.fi-fo-radio', '.fi-radio-input']),
  formEntry('form.control.rich-editor', 'Rich editor control', ['.fi-fo-rich-editor']),
  formEntry('form.control.select', 'Select control', ['.fi-fo-select', '.fi-select-input']),
  formEntry('form.control.slider', 'Slider control', ['.fi-fo-slider']),
  formEntry('form.control.tags-input', 'Tags input control', ['.fi-fo-tags-input']),
  formEntry('form.control.text', 'Text control', ['.fi-fo-text-input', '.fi-input']),
  formEntry('form.control.textarea', 'Textarea control', ['.fi-fo-textarea']),
  formEntry('form.control.toggle', 'Toggle control', ['.fi-fo-toggle', '.fi-toggle']),
  formEntry('form.control.toggle-buttons', 'Toggle buttons control', ['.fi-fo-toggle-buttons', '.fi-fo-toggle-buttons-input']),
  formEntry('form.field', 'Form field', ['.fi-fo-field']),
  formEntry('form.layout.actions', 'Actions layout', ['.fi-sc-actions']),
  formEntry('form.layout.callout', 'Callout layout', ['.fi-callout', '.fi-sc-callout']),
  formEntry('form.layout.empty-state', 'Empty state layout', ['.fi-empty-state', '.fi-sc-empty-state']),
  formEntry('form.layout.fieldset', 'Fieldset layout', ['.fi-fieldset']),
  formEntry('form.layout.fused-group', 'Fused group layout', ['.fi-sc-fused-group']),
  formEntry('form.layout.form', 'Schema form layout', ['.fi-sc-form']),
  formEntry('form.layout.grid', 'Grid layout', ['.fi-grid']),
  formEntry('form.layout.icon', 'Icon layout', ['.fi-sc-icon']),
  formEntry('form.layout.image', 'Image layout', ['.fi-sc-image']),
  formEntry('form.layout.repeater', 'Repeater layout', ['.fi-fo-repeater']),
  formEntry('form.layout.tabs', 'Tabs layout', ['.fi-tabs', '.fi-tabs-item']),
  formEntry('form.layout.text', 'Text layout', ['.fi-sc-text']),
  formEntry('form.layout.unordered-list', 'Unordered list layout', ['.fi-sc-unordered-list']),
  formEntry('form.layout.wizard', 'Wizard layout', ['.fi-sc-wizard', '.fi-sc-wizard-header-step-btn', '.fi-sc-wizard-step']),
  formEntry('form.section', 'Section layout', ['.fi-section']),
]

const infolistEntries: readonly RegistryEntry[] = [
  infolistEntry('infolist.entry.color', 'Infolist color entry', ['.fi-in-color']),
  infolistEntry('infolist.entry.icon', 'Infolist icon entry', ['.fi-in-icon']),
  infolistEntry('infolist.entry.image', 'Infolist image entry', ['.fi-in-image']),
  infolistEntry('infolist.entry.key-value', 'Infolist key-value entry', ['.fi-in-key-value']),
  infolistEntry('infolist.entry.repeatable', 'Infolist repeatable entry', ['.fi-in-repeatable', '.fi-in-table-repeatable']),
  infolistEntry('infolist.entry.text', 'Infolist text entry', ['.fi-in-text']),
  infolistEntry('infolist.layout.flex', 'Infolist flex layout', ['.fi-sc-flex']),
]

const actionEntries: readonly RegistryEntry[] = [
  showcaseEntry('action.button', 'Action button', 'action', ['.fi-btn'], ['primary', 'danger', 'success', 'warning', 'info', 'gray', 'outline', 'icon-only'], ['default', 'disabled', 'loading']),
  showcaseEntry('action.group', 'Action group', 'action', ['.fi-ac'], ['grouped'], ['default']),
]

const modalEntries: readonly RegistryEntry[] = [
  showcaseEntry('modal.content', 'Modal content', 'modal', ['.fi-modal-content'], [], ['open']),
  showcaseEntry('modal.footer', 'Modal footer', 'modal', ['.fi-modal-footer'], [], ['open']),
  showcaseEntry('modal.heading', 'Modal heading', 'modal', ['.fi-modal-heading'], [], ['open']),
  showcaseEntry('modal.window', 'Modal window', 'modal', ['.fi-modal-window'], ['small', 'medium', 'large', 'extra-large', 'slide-over'], ['open']),
]

const notificationEntries: readonly RegistryEntry[] = [
  showcaseEntry('notification.container', 'Notification container', 'notification', ['.fi-no'], ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'], ['visible']),
  showcaseEntry('notification.item', 'Notification item', 'notification', ['.fi-no-notification'], ['success', 'danger', 'warning', 'info'], ['persistent', 'transient']),
]

const dashboardEntries: readonly RegistryEntry[] = [
  showcaseEntry('dashboard.chart', 'Dashboard chart widget', 'dashboard', ['.fi-wi-chart'], [], ['default']),
  showcaseEntry('dashboard.stats', 'Dashboard stats widget', 'dashboard', ['.fi-wi-stats-overview'], [], ['default']),
  showcaseEntry('dashboard.table', 'Dashboard table widget', 'dashboard', ['.fi-wi-table'], [], ['default']),
]

const navigationEntries: readonly RegistryEntry[] = [
  showcaseEntry('navigation.global-search', 'Global search surface', 'navigation', ['.fi-global-search'], [], ['default', 'open']),
  showcaseEntry('navigation.login', 'Login surface', 'navigation', ['.fi-simple-page'], [], ['default', 'validation']),
  showcaseEntry('navigation.profile-menu', 'Profile menu surface', 'navigation', ['.fi-user-menu'], [], ['default', 'open']),
  showcaseEntry('navigation.sidebar', 'Sidebar navigation', 'navigation', ['.fi-sidebar'], [], ['default', 'collapsed']),
  showcaseEntry('navigation.sidebar-badge', 'Sidebar navigation badge', 'navigation', ['.fi-sidebar-item-badge-ctn'], [], ['default']),
  showcaseEntry('navigation.tenant-switcher', 'Controlled tenant switcher', 'navigation', ['.fi-ftb-tenant-switcher'], [], ['default', 'presentation-only']),
  showcaseEntry('navigation.topbar', 'Topbar navigation', 'navigation', ['.fi-topbar'], [], ['default']),
]

export function createThemeRegistry(): FilamentRegistry {
  return validateRegistry([
    primaryButton,
    secondaryButton,
    legacyPrimary,
    productNameInput,
    ...formEntries,
    ...infolistEntries,
    ...actionEntries,
    ...modalEntries,
    ...notificationEntries,
    ...dashboardEntries,
    ...navigationEntries,
  ])
}

export function validateRegistry(entries: readonly RegistryEntry[]): FilamentRegistry {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('Registry must contain entries')

  const ids = new Set<string>()
  const validatedEntries = entries.map((entry) => {
    validateEntry(entry, ids)
    ids.add(entry.id)
    return freezeEntry(entry)
  }).sort((left, right) => left.id.localeCompare(right.id))

  if (new Set(validatedEntries.map(({ filamentCompatibility }) => filamentCompatibility)).size !== 1) {
    throw new Error('Compatibility metadata must be consistent across registry entries')
  }

  return Object.freeze({ entries: Object.freeze(validatedEntries) })
}

export function lookupRegistryEntry(registry: FilamentRegistry, evidence: RegistryLookupEvidence): RegistryLookupResult {
  const selectorSet = new Set(evidence.selectors)
  const candidates = registry.entries.filter((entry) => entry.selectors.some((selector) => selectorSet.has(selector)))

  if (candidates.length === 0) return { status: 'no-match' }

  const compatible = candidates.filter((entry) => isCompatible(entry.filamentCompatibility, evidence.filamentVersion))
  if (compatible.length === 0) return { status: 'incompatible', required: candidates[0]!.filamentCompatibility }
  if (compatible.length > 1) return { status: 'ambiguous', candidateIds: compatible.map(({ id }) => id).sort() }

  return { status: 'matched', entry: compatible[0]! }
}

export function resolveInspectorTarget(registry: FilamentRegistry, evidence: InspectorTargetEvidence): InspectorResolution {
  return resolveInspectorTargetFromEvidence(registry, evidence)
}

function validateEntry(entry: RegistryEntry, ids: Set<string>): void {
  if (!entry || typeof entry !== 'object') throw new Error('Registry entry must be an object')
  if (!nonEmptyString(entry.id)) throw new Error('Registry entry ID must be non-empty')
  if (ids.has(entry.id)) throw new Error(`Duplicate registry ID: ${entry.id}`)
  if (!nonEmptyString(entry.label) || !nonEmptyString(entry.family)) throw new Error(`Invalid metadata for ${entry.id}`)
  if (!Array.isArray(entry.selectors) || entry.selectors.length === 0 || entry.selectors.some((selector) => !isSelector(selector))) {
    throw new Error(`Invalid selectors for ${entry.id}`)
  }
  if (!Array.isArray(entry.controls)) throw new Error(`Controls must be an array for ${entry.id}`)
  validateUniqueKeys(entry.variants, 'variants', entry.id)
  validateUniqueKeys(entry.states, 'states', entry.id)
  if (!compatibilityPattern.test(entry.filamentCompatibility)) throw new Error(`Invalid compatibility metadata for ${entry.id}`)
  validateUniqueKeys(entry.controls.map(({ id }) => id), 'control IDs', entry.id)
  entry.controls.forEach((control) => validateControl(control, entry.id))
}

function validateControl(control: RegistryControl, entryId: string): void {
  if (!control || !nonEmptyString(control.id)) throw new Error(`Invalid control metadata for ${entryId}`)
  if (!valueTypes.includes(control.valueType)) throw new Error(`Invalid control type for ${entryId}.${control.id}`)
  const constraints = control.constraints
  if (constraints?.pattern !== undefined && !isPattern(constraints.pattern)) throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.min !== undefined && typeof constraints.min !== 'number') throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.max !== undefined && typeof constraints.max !== 'number') throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.min !== undefined && !Number.isFinite(constraints.min)) throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.max !== undefined && !Number.isFinite(constraints.max)) throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.min !== undefined && constraints?.max !== undefined && constraints.min > constraints.max) throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if ('defaultValue' in control && !isValidControlValue(control.defaultValue, control)) throw new Error(`Invalid default value for ${entryId}.${control.id}`)
}

function validateUniqueKeys(keys: readonly string[], field: string, entryId: string): void {
  if (!Array.isArray(keys) || keys.some((key) => !nonEmptyString(key)) || new Set(keys).size !== keys.length) {
    throw new Error(`Invalid ${field} metadata for ${entryId}`)
  }
}

function isSelector(value: unknown): value is string {
  return typeof value === 'string' && value === value.trim() && /^(?:\.fi-[A-Za-z0-9_-]+)(?:(?:\s+)?\.fi-[A-Za-z0-9_-]+)*$/.test(value)
}

function isValidControlValue(value: unknown, control: RegistryControl): boolean {
  if (control.valueType === 'color') return typeof value === 'string' && (!control.constraints?.pattern || testPattern(control.constraints.pattern, value))
  if (control.valueType === 'string') return typeof value === 'string' && (!control.constraints?.pattern || testPattern(control.constraints.pattern, value))
  if (control.valueType === 'number') {
    return typeof value === 'number' && Number.isFinite(value)
      && (control.constraints?.min === undefined || value >= control.constraints.min)
      && (control.constraints?.max === undefined || value <= control.constraints.max)
  }
  return typeof value === 'boolean'
}

function testPattern(pattern: RegExp | { source: string; flags: string }, value: string): boolean {
  return new RegExp(pattern.source, pattern.flags).test(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isCompatible(required: string, activeVersion: string): boolean {
  const requiredMajor = compatibilityPattern.exec(required)?.[1]
  const activeMajor = versionPattern.exec(activeVersion)?.[1]
  return requiredMajor !== undefined && requiredMajor === activeMajor
}

function freezeEntry(entry: RegistryEntry): RegistryEntry {
  const controls = entry.controls.map((control) => Object.freeze({
    ...control,
    constraints: control.constraints ? Object.freeze({
      ...control.constraints,
      pattern: control.constraints.pattern ? Object.freeze(patternRepresentation(control.constraints.pattern)) : undefined,
    }) : undefined,
  }))
  return Object.freeze({
    ...entry,
    selectors: Object.freeze([...entry.selectors]),
    controls: Object.freeze(controls),
    variants: Object.freeze([...entry.variants]),
    states: Object.freeze([...entry.states]),
  })
}

function isPattern(value: unknown): boolean {
  return value instanceof RegExp || (typeof value === 'object' && value !== null
    && typeof (value as { source?: unknown }).source === 'string'
    && typeof (value as { flags?: unknown }).flags === 'string')
}

function patternRepresentation(pattern: RegExp | { source: string; flags: string }): { source: string; flags: string } {
  return { source: pattern.source, flags: pattern.flags }
}
