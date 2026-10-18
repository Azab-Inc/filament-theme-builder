import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { importFreshLocalTheme } from '@/utils/local-theme-import'

const operation = { operationId: 'e'.repeat(64), payloadDigest: 'f'.repeat(64), name: 'Pending', state: createDefaultThemeState() }

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('ftb-themes', '[]')
})

describe('import completion marker recovery', () => {
  it('leaves a valid prepared publication when complete-marker write fails', () => {
    const original = Storage.prototype.setItem
    let markerWrites = 0
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === `ftb-theme-import:${operation.operationId}` && ++markerWrites === 2) {
        original.call(this, key, value)
        throw new Error('completion marker write failed')
      }
      return original.call(this, key, value)
    })
    const failed = importFreshLocalTheme(localStorage, operation, () => 10)
    expect(failed).toMatchObject({ ok: false, error: expect.stringContaining('pending recovery') })
    expect(JSON.parse(localStorage.getItem(`ftb-theme-import:${operation.operationId}`)!).status).toBe('prepared')
    expect(localStorage.getItem('ftb-theme-active')).toBe(`import-${operation.operationId}`)
    vi.restoreAllMocks()
    expect(importFreshLocalTheme(localStorage, operation, () => 20)).toMatchObject({ ok: true })
    expect(JSON.parse(localStorage.getItem('ftb-theme-import:' + operation.operationId)!).status).toBe('complete')
    expect(JSON.parse(localStorage.getItem('ftb-themes')!)).toHaveLength(1)
  })
})
