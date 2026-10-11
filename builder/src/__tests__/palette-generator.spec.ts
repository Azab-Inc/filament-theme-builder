import { describe, expect, it } from 'vitest'
import { PALETTE_SHADES } from '@/models/foundations.model'
import { applyPaletteOverrides, generatePalette, resetPaletteShade } from '@/services/palette-generator'

describe('generatePalette', () => {
  it('generates exactly the eleven palette shade keys', () => {
    const palette = generatePalette('#6366f1')

    expect(Object.keys(palette).map(Number)).toEqual(PALETTE_SHADES)
    expect(Object.values(palette)).toHaveLength(11)
    expect(palette[500]).toBe('#6366f1')
  })

  it('returns the same shades for repeated generation of the same base', () => {
    expect(generatePalette('#22c55e')).toEqual(generatePalette('#22c55e'))
  })

  it.each(['#123', '123456', '#12xz56', '#1234567', '#123456789', 'rgb(1, 2, 3)', ''])('rejects malformed or unsupported hex %j', (base) => {
    expect(() => generatePalette(base)).toThrow(RangeError)
  })

  it('accepts six- and eight-digit hex bases', () => {
    expect(generatePalette('#abcdef')[500]).toBe('#abcdef')
    expect(generatePalette('#abcdef80')[500]).toBe('#abcdef80')
    expect(generatePalette('#abcdefFF')[500]).toBe('#abcdefff')
  })

  it('recalculates generated shades from a new base while retaining valid overrides', () => {
    const overrides = { 100: '#112233', 700: '#445566' } as const
    const generated = generatePalette('#0000ff')
    const recalculated = generatePalette('#ff0000')
    const result = applyPaletteOverrides(recalculated, overrides)

    expect(result[100]).toBe('#112233')
    expect(result[700]).toBe('#445566')
    expect(result[500]).toBe('#ff0000')
    expect(result[100]).not.toBe(generated[100])
  })

  it('lets an explicit override win for only its shade', () => {
    const generated = generatePalette('#6366f1')
    const result = applyPaletteOverrides(generated, { 300: '#123456' })

    expect(result[300]).toBe('#123456')
    for (const shade of PALETTE_SHADES.filter((shade) => shade !== 300)) {
      expect(result[shade]).toBe(generated[shade])
    }
  })

  it('rejects malformed override colors', () => {
    expect(() => applyPaletteOverrides(generatePalette('#6366f1'), { 300: 'red' })).toThrow(RangeError)
  })

  it('resets one shade to its generated value without changing other overrides', () => {
    const generated = generatePalette('#6366f1')
    const overrides = { 100: '#112233', 500: '#445566' }
    const result = resetPaletteShade(generated, overrides, 500)

    expect(result.shades[500]).toBe(generated[500])
    expect(result.overrides).toEqual({ 100: '#112233' })
  })
})
