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
    for (const [key, value] of [...previous].reverse()) { try { value === null ? storage.removeItem(key) : storage.setItem(key, value) } catch { /* report partial failure */ } }
    return { ok: false, error: storageErrorMessage(error) }
  }
}

export function assertLocalThemeId(id: string): void {
  if (!isSafeLocalThemeId(id)) throw new Error('Unsafe local theme ID')
}
