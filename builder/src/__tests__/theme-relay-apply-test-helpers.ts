import { afterEach, beforeEach, expect } from 'vitest'
import { createPinia, disposePinia, getActivePinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { applyApprovedImport } from '@/utils/theme-relay-apply'
import { previewThemeImport } from '@/utils/theme-import-service'
import { createThemeRegistry } from '@/registry/theme-registry'

export const relayImportName = 'Relay import'
const bytes = new TextEncoder().encode('{"schemaVersion":1,"colors":{"primary":"#123456"}}')
export function resetRelayImportTestState(): void { localStorage.clear(); setActivePinia(createPinia()) }
beforeEach(resetRelayImportTestState)
afterEach(() => { const pinia = getActivePinia(); if (pinia) disposePinia(pinia) })

export async function approvedRelayImport(store: ReturnType<typeof useThemeStore>, overrides: Record<string, unknown> = {}) {
  const before = ['ftb-themes', 'ftb-theme-active', `ftb-theme:import-${'a'.repeat(64)}`, `ftb-theme-history:import-${'a'.repeat(64)}`]
    .map((key) => localStorage.getItem(key))
  const result = await previewThemeImport(bytes, 'relay.json', relayImportName, createThemeRegistry())
  if (!result.valid) throw new Error('fixture rejected')
  const repeated = await previewThemeImport(bytes, 'relay.json', relayImportName, createThemeRegistry())
  if (!repeated.valid) throw new Error('fixture changed')
  expect(repeated.preview).toEqual(result.preview)
  if (before[2] !== null) before.forEach((value, index) => expect(localStorage.getItem(['ftb-themes', 'ftb-theme-active', `ftb-theme:import-${'a'.repeat(64)}`, `ftb-theme-history:import-${'a'.repeat(64)}`][index]!)).toBe(value))
  return applyApprovedImport(store, {
    operationId: 'a'.repeat(64), payloadDigest: result.preview.payloadDigest, rawBytes: bytes, filename: 'relay.json',
    sourceProposedName: relayImportName, proposedName: relayImportName, sourceVersion: 1, state: result.preview.state,
    expectedRevision: store.revision, grant: { version: 1, status: 'pending', grantId: 'f'.repeat(64), grantExpiresAt: Date.now() + 5_000,
      operationId: 'a'.repeat(64), digest: result.preview.payloadDigest, revision: store.revision, displayName: relayImportName },
    operationExpiresAt: Date.now() + 300_000, ...overrides,
  })
}
