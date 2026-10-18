import type { StorageOperationResult } from '@/models/local-theme.model'
import { isSafeLocalThemeId } from '@/utils/local-theme-validation'
import { storageErrorMessage } from '@/utils/local-theme-storage-helpers'

export function writeVerified(
  storage: Storage,
  writes: [string, string][],
  verify: () => boolean,
  finalWrites: [string, string][] = [],
  verifyFinal: () => boolean = verify,
): StorageOperationResult {
  let previous: readonly (readonly [string, string | null])[] = []
  try {
    previous = [...writes, ...finalWrites].map(([key]) => [key, storage.getItem(key)] as const)
    for (const [key, value] of writes) storage.setItem(key, value)
    if (!verify()) throw new Error('Storage read-back verification failed')
    for (const [key, value] of finalWrites) storage.setItem(key, value)
    if (finalWrites.length && !verifyFinal()) throw new Error('Final storage read-back verification failed')
    return { ok: true }
  } catch (error) {
    const unrestoredKeys: string[] = []
    for (const [key, value] of [...previous].reverse()) {
      try {
        if (value === null) storage.removeItem(key)
        else storage.setItem(key, value)
        if (storage.getItem(key) !== value) unrestoredKeys.push(key)
      } catch {
        unrestoredKeys.push(key)
      }
    }
    const operationError = storageErrorMessage(error)
    if (!unrestoredKeys.length) return { ok: false, error: operationError }
    const uniqueKeys = [...new Set(unrestoredKeys)]
    return {
      ok: false,
      error: `${operationError}; rollback incomplete for: ${uniqueKeys.join(', ')}`,
      rollbackFailed: true,
      unrestoredKeys: uniqueKeys,
    }
  }
}

export function assertLocalThemeId(id: string): void {
  if (!isSafeLocalThemeId(id)) throw new Error('Unsafe local theme ID')
}
