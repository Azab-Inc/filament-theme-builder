import { describe, expect, it } from 'vitest'
import { createPinia, disposePinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { applyApprovedImport } from '@/utils/theme-relay-apply'
import { isImportMarker, markerKeyForOperation, readImportValue, verifyImportedReadback } from '@/utils/local-theme-import-storage'
import { approvedRelayImport, relayImportName } from '@/__tests__/theme-relay-apply-test-helpers'

describe('approved relay import', () => {
  it('fingerprints canonical active and collection data as a numeric revision', () => {
    const store = useThemeStore(); const before = store.revision
    store.setPrimaryColor('#0f766e')
    expect(Number.isSafeInteger(before)).toBe(true); expect(store.revision).not.toBe(before)
  })

  it('commits only after validating the grant and creates one fresh theme on retry', async () => {
    const store = useThemeStore(); const first = await approvedRelayImport(store)
    if (!first.ok) throw new Error(first.error)
    expect(first).toMatchObject({ ok: true }); expect(store.activeThemeName).toBe(relayImportName)
    expect((await approvedRelayImport(store)).ok).toBe(true)
    expect(store.themes.filter((theme) => theme.id === `import-${'a'.repeat(64)}`)).toHaveLength(1)
  })

  it('reuses the persistent import marker after the store is reinitialized', async () => {
    const firstPinia = createPinia(); setActivePinia(firstPinia)
    const first = await approvedRelayImport(useThemeStore()); expect(first).toMatchObject({ ok: true })
    const marker = readImportValue(localStorage, markerKeyForOperation('a'.repeat(64)))
    expect(isImportMarker(marker) && verifyImportedReadback(localStorage, marker)).toBe(true)
    disposePinia(firstPinia); setActivePinia(createPinia())
    const restored = useThemeStore()
    expect(isImportMarker(marker) && verifyImportedReadback(localStorage, marker)).toBe(true)
    expect(await approvedRelayImport(restored)).toMatchObject({ ok: true, record: { id: `import-${'a'.repeat(64)}`, name: relayImportName } })
    expect(restored.themes).toHaveLength(2)
  })

  it('rejects after the collection or active canonical state changes', async () => {
    const store = useThemeStore(); const captured = store.revision; store.setPrimaryColor('#0f766e')
    expect(await approvedRelayImport(store, { expectedRevision: captured })).toMatchObject({ ok: false, error: expect.stringMatching(/stale/i) })
    expect(store.themes).toHaveLength(1); expect(localStorage.getItem(`ftb-theme-import:${'a'.repeat(64)}`)).toBeNull()
  })
})
