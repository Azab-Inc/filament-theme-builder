import { describe, expect, it } from 'vitest'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { validateFoundationMapping } from '@/utils/foundation-validation'

describe('validateFoundationMapping', () => {
  it('rejects unsupported mapping identifiers without coercing them', () => {
    expect(validateFoundationMapping('mapping.does-not-exist', createDefaultFoundationState())).toMatchObject({ valid: false, code: 'unsupported-mapping', path: 'mapping' })
    expect(validateFoundationMapping('palette.primary.base', createDefaultFoundationState())).toMatchObject({ valid: true, mapping: { mapping: 'preview-emulatable' } })
  })

  it('rejects metadata paths as editable foundation paths', () => {
    expect(validateFoundationMapping('explicitPaths', createDefaultFoundationState())).toMatchObject({
      valid: false,
      code: 'unsupported-mapping',
    })
  })

  it('keeps the canonical palette and shade allowlists explicit', () => {
    expect(PALETTE_NAMES).toEqual(['primary', 'success', 'warning', 'danger', 'info', 'gray'])
    expect(PALETTE_SHADES).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
  })
})
