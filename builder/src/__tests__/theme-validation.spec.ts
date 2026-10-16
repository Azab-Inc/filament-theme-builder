import { describe, expect, it } from 'vitest'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeOverride } from '@/models/theme.model'
import { validateThemeOverride } from '@/utils/theme-validation'
import { global, invalidColor, registry, unknownTarget, unsupportedState } from './theme-resolver.fixtures'

describe('theme override validation', () => {
  it('rejects unknown IDs, controls, unsupported keys, invalid values, and incompatible baselines', () => {
    expect(validateThemeOverride(unknownTarget, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unknown target/i) })
    expect(validateThemeOverride({ ...unknownTarget, targetId: 'button.primary', controlId: 'border' }, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unknown control/i) })
    expect(validateThemeOverride(unsupportedState, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*state/i) })
    expect(validateThemeOverride(invalidColor, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid value/i) })
    expect(validateThemeOverride({ ...global('#334155'), scope: 'component' }, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/component/i) })
    expect(validateThemeOverride({ ...global('#334155'), scope: 'invalid' } as unknown as ThemeOverride, registry)).toMatchObject({ valid: false, targetId: 'button.primary', controlId: 'background', scope: 'invalid', error: expect.stringMatching(/invalid.*scope/i) })
    expect(validateThemeOverride({ ...global('#334155'), unexpected: true } as ThemeOverride, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*key/i) })
    expect(validateThemeOverride({ ...global('#334155'), componentId: 42 } as unknown as ThemeOverride, registry)).toMatchObject({ valid: false, error: expect.stringMatching(/component.*string|identifier/i) })
  })

  it('rejects unsupported or mismatched registry compatibility baselines', () => {
    const unsupportedRegistry = {
      entries: registry.entries.map((entry) => ({ ...entry, filamentCompatibility: '4.x' })),
    } as FilamentRegistry
    const mismatchedRegistry = {
      entries: registry.entries.map((entry, index) => index === 0 ? { ...entry, filamentCompatibility: '4.x' } : entry),
    } as FilamentRegistry

    expect(validateThemeOverride(global('#334155'), unsupportedRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/unsupported.*compatibility.*baseline/i) })
    expect(validateThemeOverride(global('#334155'), mismatchedRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/compatibility.*baseline/i) })
    expect(validateThemeOverride(global('#334155'), { entries: [{ ...registry.entries[0], filamentCompatibility: 'future' }] } as FilamentRegistry)).toMatchObject({ valid: false, error: expect.stringMatching(/compatibility.*baseline/i) })
  })
})
