import { describe, expect, it } from 'vitest'

import { createThemeRegistry, validateRegistry } from '@/registry/theme-registry'
import { validatePaddingCatalog } from '@/registry/padding-registry-validation'
import { attachPaddingTargets } from '@/registry/theme-registry-catalog'
import { PADDING_UNITS } from '@/models/padding-registry.model'

const target = (id: string) =>
  createThemeRegistry().entries.flatMap((entry) => entry.paddingTargets ?? []).find((item) => item.id === id)

describe('padding target registry', () => {
  it('publishes the complete supported matrix with four-edge computed evidence and stable ordering', () => {
    const expected = [
      ['forms.input', ['.fi-fo-text-input .fi-input'], ['6px', '12px', '6px', '12px']],
      ['forms.textarea', ['.fi-fo-textarea textarea'], ['6px', '12px', '6px', '12px']],
      ['forms.select', ['.fi-fo-select.fi-fo-select-native .fi-select-input'], ['6px', '32px', '6px', '12px']],
      ['forms.section', ['.fi-section'], ['0px', '0px', '0px', '0px']],
      ['forms.section.header', ['.fi-section-header'], ['16px', '24px', '16px', '24px']],
      ['forms.section.content', ['.fi-section-content'], ['24px', '24px', '24px', '24px']],
      ['tables.container', ['.fi-ta'], ['0px', '0px', '0px', '0px']],
      ['tables.header', ['.fi-ta-header'], ['16px', '24px', '16px', '24px']],
      ['tables.header-cell', ['.fi-ta-header-cell'], ['14px', '12px', '14px', '12px']],
      ['tables.cell.text', ['.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-text'], ['16px', '12px', '16px', '12px']],
      ['tables.cell.image', ['.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-image'], ['16px', '12px', '16px', '12px']],
      ['buttons.default', ['.fi-btn'], ['8px', '12px', '8px', '12px']],
    ] as const
    const targets = createThemeRegistry().entries.flatMap((entry) => entry.paddingTargets ?? []).filter((item) => item.status === 'supported').sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    expect(targets.map(({ id }) => id)).toEqual(expected.map(([id]) => id))
    for (const [id, selectors, edges] of expected) {
      const item = targets.find((target) => target.id === id)
      expect(item).toMatchObject({ id, selectors, units: PADDING_UNITS })
      expect(item?.order).toBe(expected.findIndex(([targetId]) => targetId === id) + 1)
      const evidence = item?.evidence.find((entry) => entry.selector === selectors[0])
      expect(evidence?.values).toEqual({ top: edges[0], right: edges[1], bottom: edges[2], left: edges[3] })
    }
  })

  it('declares section, nesting, variant, and state ownership without synthetic global targets', () => {
    const targets = createThemeRegistry().entries.flatMap((entry) => entry.paddingTargets ?? []).sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    expect(targets.filter(({ status }) => status === 'supported').map(({ order }) => order)).toEqual([...Array(12)].map((_, index) => index + 1))
    expect(targets.find(({ id }) => id === 'forms.input')).toMatchObject({ sectionId: 'forms', nestedPolicy: 'leaf-defaults' })
    expect(targets.find(({ id }) => id === 'forms.section')).toMatchObject({ sectionId: 'forms', nestedPolicy: 'explicit-only' })
    expect(targets.find(({ id }) => id === 'tables.container')).toMatchObject({ sectionId: 'tables', nestedPolicy: 'explicit-only' })
    expect(targets.find(({ id }) => id === 'buttons.default')).toMatchObject({ sectionId: 'buttons', nestedPolicy: 'leaf-defaults', variantSelectors: { primary: ['.fi-btn.fi-color-primary'], outlined: ['.fi-btn.fi-outlined'] }, stateSelectors: { disabled: ['.fi-btn:disabled'] } })
    expect(targets.some(({ id }) => id === 'global.padding')).toBe(false)
  })

  it('publishes every verified target with exact selectors and evidence', () => {
    const registry = createThemeRegistry()
    const targets = registry.entries.flatMap((entry) => entry.paddingTargets ?? [])

    expect(targets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'forms.input', selectors: ['.fi-fo-text-input .fi-input'], targetKind: 'leaf' }),
      expect.objectContaining({ id: 'forms.textarea', selectors: ['.fi-fo-textarea textarea'], targetKind: 'leaf' }),
      expect.objectContaining({ id: 'forms.select', selectors: ['.fi-fo-select.fi-fo-select-native .fi-select-input'], targetKind: 'leaf' }),
      expect.objectContaining({ id: 'tables.cell.text', selectors: ['.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-text'], targetKind: 'leaf' }),
      expect.objectContaining({ id: 'tables.cell.image', selectors: ['.fi-ta-table tbody td.fi-ta-cell > .fi-ta-col > .fi-ta-image'], targetKind: 'leaf' }),
    ]))
    expect(target('tables.cell.text')?.selectors).not.toContain('.fi-ta-cell')
    expect(target('forms.multiselect')?.status).toBe('unmapped')
  })

  it('keeps button variant and disabled-state metadata on the default target', () => {
    expect(target('buttons.default')).toMatchObject({ variants: ['primary', 'outlined'], states: ['disabled'] })
    expect(target('buttons.default')?.evidence.length).toBeGreaterThan(0)
  })

  it('rejects malformed selectors, evidence values, units, identities, and duplicate IDs', () => {
    const catalog = validatePaddingCatalog
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [] })).toThrow(/target/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [{ ...target('forms.input'), selectors: ['.fi-ta-cell > *'] }] })).toThrow(/selector/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [{ ...target('forms.input'), evidence: [{ ...target('forms.input')?.evidence[0], values: { top: '2' } }] }] })).toThrow(/unit/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [{ ...target('forms.input'), variants: ['primary', 'primary'] }] })).toThrow(/variant/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [{ ...target('forms.input'), states: ['focus-visible', 'focus-visible'] }] })).toThrow(/state/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [{ ...target('forms.input'), variants: ['primary', 1] }] })).toThrow(/variant/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', unexpected: true, targets: [] })).toThrow(/schema/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [{ ...target('forms.input'), unexpected: true }] })).toThrow(/schema/i)
    expect(() => catalog({ version: 1, compatibility: '5.9.0', targets: [{ ...target('forms.input') }, { ...target('forms.textarea'), order: target('forms.input')?.order }] })).toThrow(/order/i)
    expect(() => validateRegistry([createThemeRegistry().entries[0]!, { ...createThemeRegistry().entries[0]!, id: 'duplicate' }])).toThrow(/duplicate/i)
  })

  it('keeps unsupported metadata non-emitting and rejects unknown owners', () => {
    const targets = createThemeRegistry().entries.flatMap((entry) => entry.paddingTargets ?? [])
    expect(targets.filter(({ status }) => status !== 'supported').every(({ selectors, evidence }) => selectors.length === 0 && evidence.every(({ verified, selector, sampleCount }) => !verified && !selector && sampleCount === undefined))).toBe(true)
    expect(() => attachPaddingTargets(createThemeRegistry().entries, { version: 1, compatibility: '5.9.0', targets: [{ ...targets[0]!, entryId: 'missing.entry' }] })).toThrow(/owner|entry/i)
  })

  it('keeps every existing registry family visible when padding is unmapped', () => {
    const registry = createThemeRegistry()
    const families = new Set(registry.entries.map(({ family }) => family))
    const represented = new Set(registry.entries.filter(({ paddingTargets }) => paddingTargets?.length).map(({ family }) => family))
    expect([...families].filter((family) => !represented.has(family))).toEqual([])
  })
})
