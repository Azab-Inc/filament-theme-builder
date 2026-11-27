import { describe, expect, it } from 'vitest'
import { generateUniqueElementId, validateUniqueElementIdAssignment, validateUniqueElementIdAssignments } from '@/utils/unique-element-id-validation'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { renderRawOverrides } from '@/utils/vanilla-css-export-raw-overrides'
import { ref } from 'vue'
import { useThemeUniqueElementActions } from '@/composables/use-theme-unique-element-actions'
import { serializeCanonicalTheme, deserializeTheme } from '@/utils/theme-serialization'
import { createThemeRegistry } from '@/registry/theme-registry'
import { useBuilderActions } from '@/composables/use-builder-actions'
import { validateFoundationState } from '@/utils/foundation-state-validation.util'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'

describe('unique inspector element IDs', () => {
  it('generates a stable collision-safe ID and validates its bounded binding', () => {
    const id = generateUniqueElementId('.fi-section-header', 1, new Set(['ftb-fi-section-header-2']))
    expect(id).toBe('ftb-fi-section-header-2-2')
    expect(validateUniqueElementIdAssignment({ id, sourceSelector: '.fi-section-header', matchIndex: 1 })).toMatchObject({ valid: true })
  })

  it('rejects malformed, reserved, duplicate, and out-of-bounds assignments', () => {
    expect(validateUniqueElementIdAssignment({ id: '1bad', sourceSelector: '.fi-section-header', matchIndex: 0 }).valid).toBe(false)
    expect(validateUniqueElementIdAssignment({ id: 'ftb-managed-theme', sourceSelector: '.fi-section-header', matchIndex: 0 }).valid).toBe(false)
    expect(validateUniqueElementIdAssignment({ id: 'safe', sourceSelector: '.fi-section-header', matchIndex: 1000 }).valid).toBe(false)
    expect(validateUniqueElementIdAssignments([
      { id: 'safe', sourceSelector: '.fi-section-header', matchIndex: 0 },
      { id: 'safe', sourceSelector: '.fi-section-header', matchIndex: 1 },
    ]).valid).toBe(false)
  })

  it('renders unique rules after shared rules', () => {
    const theme = createDefaultCurrentThemeState()
    theme.rawOverrides = [
      { selector: '.fi-section-header', properties: { color: '#111111' } },
      { selector: '#hero-header', properties: { color: '#222222' } },
    ]
    const css = renderRawOverrides(theme, [])
    expect(css.indexOf('.fi-section-header')).toBeLessThan(css.indexOf('#hero-header'))
  })

  it('exports unique state rules for a clean fixture with the same ID markup', () => {
    const theme = createDefaultCurrentThemeState()
    theme.uniqueElementIds = [{ id: 'bottom-header', sourceSelector: '.fi-section-header', matchIndex: 1 }]
    theme.rawOverrides = [
      { selector: '.fi-section-header', properties: { color: '#111111' } },
      { selector: '#bottom-header:hover', properties: { color: '#222222' } },
      { selector: '#bottom-header:focus', properties: { color: '#333333' } },
    ]

    const css = renderRawOverrides(theme, [])

    expect(css).toContain('#bottom-header:hover')
    expect(css).toContain('#bottom-header:focus')
    expect(css.indexOf('.fi-section-header')).toBeLessThan(css.indexOf('#bottom-header:hover'))
  })

  it('renames and disables only the unique target while preserving the shared rule', () => {
    const theme = ref(createDefaultCurrentThemeState())
    const actions = useThemeUniqueElementActions({ theme, registry: createThemeRegistry() })
    const id = actions.enableUniqueElementId('.fi-section-header', 1)
    actions.renameUniqueElementId('.fi-section-header', 1, 'bottom-header')
    theme.value.rawOverrides = [{ selector: '.fi-section-header', properties: { color: '#111111' } }, { selector: '#bottom-header', properties: { color: '#222222' } }]
    actions.disableUniqueElementId('.fi-section-header', 1)
    expect(theme.value.rawOverrides).toEqual([{ selector: '.fi-section-header', properties: { color: '#111111' } }])
    expect(theme.value.uniqueElementIds).toEqual([])
    expect(id).toContain('ftb-')
  })

  it('round-trips the assignment and unique raw rule through canonical JSON', () => {
    const theme = createDefaultCurrentThemeState()
    theme.uniqueElementIds = [{ id: 'bottom-header', sourceSelector: '.fi-section-header', matchIndex: 1 }]
    theme.rawOverrides = [{ selector: '#bottom-header', properties: { color: '#222222' }, darkProperties: { color: '#333333' } }]
    const exported = serializeCanonicalTheme(theme)
    const imported = deserializeTheme(JSON.stringify(exported), createThemeRegistry())
    expect(imported.valid).toBe(true)
    if (imported.valid) expect(imported.state.uniqueElementIds).toEqual(theme.uniqueElementIds)
  })

  it('accepts state-specific unique raw rules when the bare ID is assigned', () => {
    const theme = createDefaultCurrentThemeState()
    theme.uniqueElementIds = [{ id: 'bottom-header', sourceSelector: '.fi-section-header', matchIndex: 1 }]
    theme.rawOverrides = [{ selector: '#bottom-header:hover', properties: { color: '#222222' } }]

    expect(validateFoundationState(theme, createThemeRegistry()).valid).toBe(true)
  })

  it('renames and disables every state rule for only the matching assignment', () => {
    const theme = ref(createDefaultCurrentThemeState())
    const actions = useThemeUniqueElementActions({ theme, registry: createThemeRegistry() })
    const target = { kind: 'raw', selector: '#ftb-fi-section-header-2:hover', property: 'color' } as const
    theme.value.modeLinks = { 'target:header': { identity: 'target:header', target, value: '#111111', linked: true } }
    actions.enableUniqueElementId('.fi-section-header', 1)
    actions.renameUniqueElementId('.fi-section-header', 1, 'bottom-header')
    theme.value.rawOverrides = [
      { selector: '#bottom-header', properties: { color: '#111111' } },
      { selector: '#bottom-header:hover', properties: { color: '#222222' } },
      { selector: '#other-header:focus', properties: { color: '#333333' } },
    ]

    actions.disableUniqueElementId('.fi-section-header', 1)

    expect(theme.value.rawOverrides).toEqual([{ selector: '#other-header:focus', properties: { color: '#333333' } }])
    const migratedTarget = { ...target, selector: '.fi-section-header:hover' } as const
    const migratedIdentity = modeLinkTargetIdentity(migratedTarget)
    expect(theme.value.modeLinks).toEqual({ [migratedIdentity]: { identity: migratedIdentity, target: migratedTarget, value: '#111111', linked: true } })
  })

  it('keeps unique light and dark values isolated through reset and history', () => {
    setActivePinia(createPinia())
    const store = useThemeStore()
    const id = store.enableUniqueElementId('.fi-section-header', 1)
    store.setRawOverride(`#${id}`, 'color', '#111111', 'light')
    store.setRawOverride(`#${id}`, 'color', '#222222', 'dark')
    expect(store.theme.rawOverrides).toContainEqual({ selector: `#${id}`, properties: { color: '#111111' }, darkProperties: { color: '#222222' } })
    store.resetRawProperty(`#${id}`, 'color', 'dark')
    expect(store.theme.rawOverrides).toContainEqual({ selector: `#${id}`, properties: { color: '#111111' } })
    store.undo()
    expect(store.theme.rawOverrides).toContainEqual({ selector: `#${id}`, properties: { color: '#111111' }, darkProperties: { color: '#222222' } })
    store.redo()
    expect(store.theme.rawOverrides).toContainEqual({ selector: `#${id}`, properties: { color: '#111111' } })
  })

  it('surfaces rename failures while retaining the accepted ID and raw selector', () => {
    const uniqueElementIdError = ref<string | undefined>()
    const rawSelector = ref('#accepted-id')
    const state = {
      uniqueElementIdError,
      rawSelector,
      activeMode: ref<'light' | 'dark'>('light'),
      inspectorEvidence: ref({ targetSelector: '.fi-section-header', matchIndex: 1 }),
      theme: {
        theme: { rawOverrides: [{ selector: '#accepted-id', properties: { color: '#111111' } }] },
        renameUniqueElementId: () => 'This ID is already assigned.',
      },
    }
    const actions = useBuilderActions(state as never)
    const input = document.createElement('input')
    input.value = 'duplicate-id'
    actions.setUniqueElementId({ target: input } as unknown as Event)
    expect(uniqueElementIdError.value).toBe('This ID is already assigned.')
    expect(rawSelector.value).toBe('#accepted-id')
    expect(state.theme.theme.rawOverrides).toEqual([{ selector: '#accepted-id', properties: { color: '#111111' } }])
  })

  it('rejects a colliding rename without mutating assignment, state rules, or mode links', () => {
    const theme = ref(createDefaultCurrentThemeState())
    theme.value.uniqueElementIds = [
      { id: 'top-header', sourceSelector: '.fi-section-header', matchIndex: 0 },
      { id: 'bottom-header', sourceSelector: '.fi-section-header', matchIndex: 1 },
    ]
    theme.value.rawOverrides = [{ selector: '#bottom-header:hover', properties: { color: '#222222' } }]
    const before = JSON.parse(JSON.stringify(theme.value))
    const actions = useThemeUniqueElementActions({ theme, registry: createThemeRegistry() })

    expect(actions.renameUniqueElementId('.fi-section-header', 0, 'bottom-header')).toBe('This ID is already assigned.')
    expect(theme.value).toEqual(before)
  })
})
