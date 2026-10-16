import { describe, expect, it } from 'vitest'
import type { FoundationState } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'

function validState(): FoundationState {
  return createDefaultFoundationState()
}

function expectError(value: unknown, code: string, path: string): void {
  expect(validateFoundationState(value)).toMatchObject({ valid: false, code, path })
}

describe('versioned foundation payload validation', () => {
  it('accepts a complete versioned V3 payload with canonical nested records', () => {
    const state = validState()
    expect(validateFoundationState({
      schemaVersion: 3,
      colors: { primary: state.palettes.primary.base },
      foundations: state,
      overrides: [],
      customCss: '',
    })).toMatchObject({ valid: true })
  })

  it('rejects a V3 payload when any required foundation record is missing', () => {
    const state = validState()
    const { surfaces: _surfaces, ...missingSurfaces } = state
    expectError({
      schemaVersion: 3,
      colors: { primary: state.palettes.primary.base },
      foundations: missingSurfaces,
      overrides: [],
      customCss: '',
    }, 'invalid-value', 'foundations.surfaces')
  })

  it('rejects duplicate override identities in a versioned foundation payload', () => {
    const state = validState()
    expectError({
      schemaVersion: 3,
      colors: { primary: '#6366f1' },
      foundations: state,
      customCss: '',
      overrides: [
        { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456' },
        { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#654321' },
      ],
    }, 'duplicate-override', 'overrides[1]')
  })

  it.each([
    ['overrides[0].targetId', { targetId: 12 }],
    ['overrides[0].scope', { scope: 'invalid' }],
    ['overrides[0].value', { value: { unsafe: true } }],
    ['overrides[0].componentId', { componentId: 12 }],
  ])('rejects malformed override field at %s', (path, change) => {
    const state = validState()
    const override = { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456', ...change }
    expectError({
      schemaVersion: 3,
      colors: { primary: '#6366f1' },
      foundations: state,
      customCss: '',
      overrides: [override],
    }, 'invalid-value', path)
  })

  it.each(['<style>body{color:red}</style>', '<script>alert(1)</script>', 'url(https://example.test)', '@import url(font.css)', 'body { color: red; }'])(
    'rejects unsafe custom CSS %s',
    (customCss) => {
      const state = validState()
      expectError({ schemaVersion: 3, colors: { primary: '#6366f1' }, foundations: state, customCss, overrides: [] }, 'invalid-value', 'customCss')
    },
  )
})
