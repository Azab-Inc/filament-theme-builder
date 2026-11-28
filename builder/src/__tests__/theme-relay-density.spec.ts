import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { createThemeRegistry } from '@/registry/theme-registry'
import { applyThemeRelayIntent, parseThemeRelayIntent } from '@/utils/theme-relay-intent'
import type { ThemeRelayIntent } from '@/models/theme-relay-intent.model'
import { applyDensityPreset } from '@/utils/apply-density-preset'

const densityTarget: Record<string, string> = { kind: 'foundation', path: 'density' }

describe('density relay boundary', (): void => {
  it.each(['link', 'unlink', 'create-color', 'create-palette', 'update', 'remove'] as const)('rejects %s for the shared density target', (action: ThemeRelayIntent['action']): void => {
    const payload: Record<string, unknown> = { schemaVersion: 1, kind: 'theme-intent', action, target: densityTarget, value: 'compact' }
    expect(parseThemeRelayIntent(JSON.stringify(payload), createThemeRegistry())).toBeNull()
  })

  it.each([
    {}, { kind: 'foundation' }, { kind: 'foundation', path: 'density.light' }, { kind: 'foundation', path: 'density', extra: true },
  ])('rejects malformed density targets: %s', (target: Record<string, unknown>): void => {
    const payload: Record<string, unknown> = { schemaVersion: 1, kind: 'theme-intent', action: 'set', target, value: 'compact' }
    expect(parseThemeRelayIntent(JSON.stringify(payload), createThemeRegistry())).toBeNull()
  })

  it.each([undefined, null, 1, true, ''])('rejects absent or invalid density values: %s', (value: unknown): void => {
    const payload: Record<string, unknown> = { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: densityTarget }
    if (value !== undefined) payload.value = value
    expect(parseThemeRelayIntent(JSON.stringify(payload), createThemeRegistry())).toBeNull()
  })

  it('keeps read nonmutating and direct application safe', (): void => {
    const registry: ReturnType<typeof createThemeRegistry> = createThemeRegistry()
    const state: ReturnType<typeof createDefaultCurrentThemeState> = createDefaultCurrentThemeState()
    const read: ThemeRelayIntent | null = parseThemeRelayIntent(JSON.stringify({ schemaVersion: 1, kind: 'theme-intent', action: 'read', target: densityTarget }), registry)
    expect(read).not.toBeNull()
    expect(applyThemeRelayIntent(state, read!, registry)).toEqual(state)
    const link: ThemeRelayIntent = { schemaVersion: 1, kind: 'theme-intent', action: 'link', target: densityTarget as ThemeRelayIntent['target'] }
    expect((): void => { applyThemeRelayIntent(state, link, registry) }).toThrow('invalid_intent')
  })

  it('shares the pure density transformation with the relay boundary', (): void => {
    const state: ReturnType<typeof createDefaultCurrentThemeState> = createDefaultCurrentThemeState()
    state.foundations.spacing['2'] = 99
    state.foundations.explicitPaths.push('spacing.2')
    const before: ReturnType<typeof createDefaultCurrentThemeState> = structuredClone(state)
    const transformed: typeof state.foundations = applyDensityPreset(state.foundations, 'compact')
    const intent: ThemeRelayIntent = { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: densityTarget as ThemeRelayIntent['target'], value: 'compact' }
    const relayed: ReturnType<typeof createDefaultCurrentThemeState> = applyThemeRelayIntent(state, intent, createThemeRegistry())
    expect(relayed.foundations.density).toBe(transformed.density)
    expect(relayed.foundations.spacing).toEqual(transformed.spacing)
    expect(state).toEqual(before)
    expect(transformed.explicitPaths).not.toContain('spacing.2')
    expect(state.foundations.explicitPaths).toContain('spacing.2')
  })
})
