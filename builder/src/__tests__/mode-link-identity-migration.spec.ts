import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { validateFoundationState } from '@/utils/foundation-validation'
import { createThemeRegistry } from '@/registry/theme-registry'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'

describe('stable mode-link identities', () => {
  const target = { kind: 'raw' as const, selector: '.fi-section', property: 'color' as const }
  const legacy = `target:${JSON.stringify(target)}`
  function state() {
    const value = createDefaultCurrentThemeState()
    value.rawOverrides = [{ selector: target.selector, properties: { color: '#123456' }, darkProperties: { color: '#123456' } }]
    value.modeLinks = { [legacy]: { identity: legacy, value: '#123456', linked: true, target } }
    return value
  }

  it('preserves existing saved links while normalizing order-dependent keys', () => {
    const result = migrateVersionedTheme(state(), createThemeRegistry())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const key = modeLinkTargetIdentity(target)
    expect(Object.keys(result.state.modeLinks)).toEqual([key])
    expect(result.state.modeLinks[key]?.identity).toBe(key)
    expect(result.state.rawOverrides[0]?.darkProperties?.color).toBe('#123456')
  })

  it('rejects duplicate logical targets despite different descriptor key order', () => {
    const value = state()
    const reordered = { property: target.property, selector: target.selector, kind: target.kind }
    const key = `target:${JSON.stringify(reordered)}`
    value.modeLinks[key] = { identity: key, value: '#123456', linked: true, target: reordered }
    expect(validateFoundationState(value).valid).toBe(false)
  })
})
