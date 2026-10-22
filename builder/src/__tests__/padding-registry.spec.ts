import { describe, expect, it } from 'vitest'

import { createThemeRegistry, validateRegistry } from '@/registry/theme-registry'
import { validatePaddingCatalog } from '@/registry/padding-registry-validation'

const target = (id: string) =>
  createThemeRegistry().entries.flatMap((entry) => entry.paddingTargets ?? []).find((item) => item.id === id)

describe('padding target registry', () => {
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
    expect(() => validateRegistry([createThemeRegistry().entries[0]!, { ...createThemeRegistry().entries[0]!, id: 'duplicate' }])).toThrow(/duplicate/i)
  })
})
