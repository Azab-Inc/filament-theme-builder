import { describe, expect, it } from 'vitest'
import type { FoundationState } from '@/models/foundations.model'
import type { FoundationMappingValidationResult } from '@/models/foundation-mapping-validation-result.model'
import type { ValidationError } from '@/models/validation-error.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { validateFoundationMapping, validateFoundationState } from '@/utils/foundation-validation'

function validState(): FoundationState {
  return createDefaultFoundationState()
}

function expectError(value: unknown, code: string, path: string): void {
  expect(validateFoundationState(value)).toMatchObject({ valid: false, code, path })
}

describe('validateFoundationState basics', () => {
  it('exposes validation result types from their dedicated model boundaries', () => {
    const error: ValidationError = { valid: false, code: 'invalid-value', path: 'state', message: 'Foundation state must be an object' }
    const mappingResult: FoundationMappingValidationResult = validateFoundationMapping('palette.primary.base', validState())

    expect(validateFoundationState(null)).toEqual(error)
    expect(mappingResult).toMatchObject({ valid: true, mapping: { mapping: 'preview-emulatable' } })
  })

  it('accepts the typed default foundation state', () => {
    expect(validateFoundationState(validState())).toMatchObject({ valid: true })
    expect(validState().explicitPaths).toEqual([])
  })

  it('accepts an explicit provenance path when it is canonical', () => {
    expect(validateFoundationState({ ...validState(), explicitPaths: ['surfaces.page.light'] })).toMatchObject({ valid: true })
    expectError({ ...validState(), explicitPaths: ['surfaces.page.injected'] }, 'invalid-value', 'explicitPaths')
  })

  it('rejects duplicate explicit provenance paths', () => {
    expectError({ ...validState(), explicitPaths: ['density', 'density'] }, 'invalid-value', 'explicitPaths')
  })

  it.each([
    ['palettes.primary.overrides.500', (state: FoundationState) => ({ ...state, explicitPaths: ['palettes.primary.overrides.500'] })],
  ])('rejects provenance for absent palette value %s', (_path, makeInvalid) => {
    expectError(makeInvalid(validState()), 'invalid-value', 'explicitPaths')
  })

})
