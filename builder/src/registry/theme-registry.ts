import type {
  FilamentRegistry,
  RegistryControl,
  RegistryEntry,
  RegistryLookupEvidence,
  RegistryLookupResult,
  RegistryValueType,
} from '@/models/theme-registry.model'

const valueTypes: readonly RegistryValueType[] = ['boolean', 'color', 'number', 'string']
const compatibilityPattern = /^(\d+)\.x$/
const versionPattern = /^(\d+)(?:\.\d+){0,2}$/

const primaryButton: RegistryEntry = {
  id: 'button.primary',
  label: 'Primary button',
  family: 'button',
  selectors: ['.fi-btn-primary'],
  controls: [
    {
      id: 'background',
      valueType: 'color',
      constraints: { pattern: /^#[\da-f]{6}$/i },
    },
  ],
  variants: ['primary', 'secondary'],
  states: ['default', 'hover'],
  filamentCompatibility: '5.x',
}

const secondaryButton: RegistryEntry = {
  ...primaryButton,
  id: 'button.secondary',
  label: 'Secondary button',
  selectors: ['.fi-btn-secondary'],
}

const legacyPrimary: RegistryEntry = {
  id: 'global.primary',
  label: 'Primary color',
  family: 'global',
  selectors: ['.fi-btn'],
  controls: [
    {
      id: 'primary',
      valueType: 'color',
      constraints: { pattern: /^#[\da-f]{6}$/i },
    },
  ],
  variants: [],
  states: [],
  filamentCompatibility: '5.x',
}

export function createThemeRegistry(): FilamentRegistry {
  return validateRegistry([primaryButton, secondaryButton, legacyPrimary])
}

export function validateRegistry(entries: readonly RegistryEntry[]): FilamentRegistry {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('Registry must contain entries')

  const ids = new Set<string>()
  const validatedEntries = entries.map((entry) => {
    validateEntry(entry, ids)
    ids.add(entry.id)
    return freezeEntry(entry)
  }).sort((left, right) => left.id.localeCompare(right.id))

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

function validateEntry(entry: RegistryEntry, ids: Set<string>): void {
  if (!entry || typeof entry !== 'object') throw new Error('Registry entry must be an object')
  if (!nonEmptyString(entry.id)) throw new Error('Registry entry ID must be non-empty')
  if (ids.has(entry.id)) throw new Error(`Duplicate registry ID: ${entry.id}`)
  if (!nonEmptyString(entry.label) || !nonEmptyString(entry.family)) throw new Error(`Invalid metadata for ${entry.id}`)
  if (!Array.isArray(entry.selectors) || entry.selectors.length === 0 || entry.selectors.some((selector) => !isSelector(selector))) {
    throw new Error(`Invalid selectors for ${entry.id}`)
  }
  if (!Array.isArray(entry.controls) || entry.controls.length === 0) throw new Error(`Controls are required for ${entry.id}`)
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
  if (constraints?.pattern !== undefined && !(constraints.pattern instanceof RegExp)) throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.min !== undefined && typeof constraints.min !== 'number') throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.max !== undefined && typeof constraints.max !== 'number') throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.min !== undefined && constraints?.max !== undefined && constraints.min > constraints.max) throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
}

function validateUniqueKeys(keys: readonly string[], field: string, entryId: string): void {
  if (!Array.isArray(keys) || keys.some((key) => !nonEmptyString(key)) || new Set(keys).size !== keys.length) {
    throw new Error(`Invalid ${field} metadata for ${entryId}`)
  }
}

function isSelector(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 1 && /^[.#[]/.test(value)
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
    constraints: control.constraints ? Object.freeze({ ...control.constraints }) : undefined,
  }))
  return Object.freeze({
    ...entry,
    selectors: Object.freeze([...entry.selectors]),
    controls: Object.freeze(controls),
    variants: Object.freeze([...entry.variants]),
    states: Object.freeze([...entry.states]),
  })
}
