import { describe, expect, it } from 'vitest'

import { resolveThemeValue } from '@/utils/theme-resolver'
import { validateThemeState } from '@/utils/theme-validation'
import {
  emptyTheme, global, invalidExternalTheme, registry, requestFor, withOverrides,
} from './theme-resolver.fixtures'

describe('invalid theme state handling', () => {
  it('does not throw while resolving a quarantined invalid external override', () => {
    expect(() => resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).not.toThrow()
    expect(resolveThemeValue(invalidExternalTheme, registry, requestFor('primary'))).toMatchObject({ status: 'invalid-state' })
    expect(validateThemeState(invalidExternalTheme, registry)).toMatchObject({ valid: false, invalidOverrides: [{ targetId: 'button.primary', controlId: 'background', scope: 'global', error: expect.stringMatching(/invalid value/i) }] })
  })

  it('returns a typed invalid result for malformed or unsupported resolve requests', () => {
    const requests: unknown[] = [
      null,
      [],
      { targetId: 'button.primary' },
      { targetId: 'button.primary', controlId: 'background', componentId: 42 },
      { targetId: 'button.primary', controlId: 'background', variantId: 'primary' },
      { targetId: 'button.primary', controlId: 'background', extra: true },
      { targetId: 'button.unknown', controlId: 'background' },
      { targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId: 'unknown' },
    ]

    for (const request of requests) {
      expect(() => resolveThemeValue(emptyTheme, registry, request as never)).not.toThrow()
      expect(resolveThemeValue(emptyTheme, registry, request as never)).toMatchObject({ status: 'invalid-request' })
    }
  })

  it('does not resolve duplicate override identities by array order', () => {
    const duplicateState = withOverrides(global('#334155'), global('#4f46e5'))

    expect(validateThemeState(duplicateState, registry)).toMatchObject({
      valid: false,
      invalidOverrides: expect.arrayContaining([expect.objectContaining({ error: expect.stringMatching(/duplicate.*button\.primary.*background/i) })]),
    })
    expect(resolveThemeValue(duplicateState, registry, requestFor('primary'))).toMatchObject({ status: 'invalid-state' })
  })
})
