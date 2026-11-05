import { describe, expect, it } from 'vitest'
import { colorReferenceOptions, isBuiltinPaletteReference } from '@/utils/color-reference-options'
import { isColorFieldValueValid } from '@/utils/color-field-validation'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('theme color reference catalog', () => {
  it('includes all built-in shades without requiring custom tokens', () => {
    const options = colorReferenceOptions()
    expect(options).toHaveLength(66)
    expect(options.find((option) => option.value === 'var(--ftb-palette-primary-500)')).toMatchObject({ label: 'primary 500', group: 'primary' })
    expect(options.every((option) => isBuiltinPaletteReference(option.value))).toBe(true)
  })

  it('uses friendly unique user labels and active-mode swatch colors', () => {
    const tokens = ['user.color.secondary', 'user.palette.brand.500', 'user.color.secondary', 'user.invalid.payload']
    const options = colorReferenceOptions(tokens, { 'var(--ftb-palette-primary-500)': '#123456', 'user.color.secondary': '#654321' })
    expect(options).toHaveLength(68)
    expect(options.find((option) => option.value === tokens[0])).toMatchObject({ label: 'secondary', color: '#654321' })
    expect(options.find((option) => option.value === tokens[1])).toMatchObject({ label: 'brand 500', group: 'brand' })
    expect(options.find((option) => option.value === 'var(--ftb-palette-primary-500)')?.color).toBe('#123456')
    expect(options.some((option) => option.label.includes('user.'))).toBe(false)
  })

  it('permits bounded palette references in color fields but not seeds or non-color raw properties', () => {
    for (const value of ['var(--primary-500)', 'var(--ftb-palette-primary-500)', 'user.color.secondary']) {
      expect(isColorFieldValueValid(value, 'foundation')).toBe(true)
      expect(isColorFieldValueValid(value, 'hex6')).toBe(true)
      expect(isColorFieldValueValid(value, 'raw', 'color')).toBe(true)
      expect(isColorFieldValueValid(value, 'hex68')).toBe(false)
      expect(isColorFieldValueValid(value, 'raw', 'opacity')).toBe(false)
    }
    expect(isColorFieldValueValid('var(--unknown-500)', 'hex6')).toBe(false)
    expect(isColorFieldValueValid('var(--primary-501)', 'hex6')).toBe(false)
  })

  it('validates semantic references at the canonical boundary without admitting arbitrary variables', () => {
    const state = createDefaultCurrentThemeState()
    for (const [value, valid] of [['var(--primary-500)', true], ['var(--ftb-palette-primary-500)', true], ['var(--unknown-500)', false], ['var(--primary-501)', false], ['var(--ftb-palette-primary-501)', false]] as const) {
      state.overrides = [{ targetId: 'form.product-name', controlId: 'background', scope: 'global', value }]
      expect(validateFoundationState(state).valid).toBe(valid)
    }
  })

  it('shares the active palette color when a palette reference is explicitly locked', () => {
    localStorage.clear(); setActivePinia(createPinia())
    const store = useThemeStore()
    store.setPrimaryColor('#123456', 'light'); store.setPrimaryColor('#abcdef', 'dark')
    const target = { kind: 'raw' as const, selector: '.fi-section', property: 'color' as const }
    store.setRawOverride(target.selector, target.property, 'var(--ftb-palette-primary-500)', 'light')
    store.linkModeTarget(target, 'dark', 'replace')
    expect(store.theme.rawOverrides[0]?.properties.color).toBe('#abcdef')
    expect(store.theme.rawOverrides[0]?.darkProperties?.color).toBe('#abcdef')
    store.setRawOverride(target.selector, target.property, 'var(--ftb-palette-primary-500)', 'light')
    expect(store.theme.rawOverrides[0]?.darkProperties?.color).toBe('#123456')
  })
})
