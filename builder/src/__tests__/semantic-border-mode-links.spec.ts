import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { createThemeRegistry } from '@/registry/theme-registry'
import { modeLinkTargetIdentity, type ModeLinkTarget } from '@/models/mode-link-target.model'
import { readModeLinkTarget, writeModeLinkTarget } from '@/utils/mode-link-targets'
import { readStoredModeLinkValue } from '@/utils/mode-link-stored-values'
import { validModeLinkTarget } from '@/utils/mode-link-target-validation'

describe('semantic border mode links', () => {
  it('uses an independent canonical identity and writes both explicit modes', () => {
    const state = createDefaultCurrentThemeState()
    const registry = createThemeRegistry()
    const target: ModeLinkTarget = { kind: 'semantic-border', targetId: 'table.header', edge: 'bottom', property: 'width', scope: 'global' }
    expect(validModeLinkTarget(target, registry)).toBe(true)
    expect(modeLinkTargetIdentity(target)).toContain('semantic-border|')
    expect(writeModeLinkTarget(state, target, 3, 'light', registry)).toBe(true)
    expect(readModeLinkTarget(state, target, 'dark', registry)).toBe(3)
    expect(readStoredModeLinkValue(state, target, 'light')).toBe(3)
    expect(readStoredModeLinkValue(state, target, 'dark')).toBe(3)
  })
})
