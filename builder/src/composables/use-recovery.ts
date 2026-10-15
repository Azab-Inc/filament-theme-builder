type RecoveryStoreActions = Pick<{
  getLegacyRecoveryJson(): string | null
  restoreLegacyRecovery(): boolean
}, 'getLegacyRecoveryJson' | 'restoreLegacyRecovery'>

export function useRecovery(store: RecoveryStoreActions) {
  function restoreLegacyRecovery(): boolean {
    return store.restoreLegacyRecovery()
  }

  function downloadLegacyRecovery(): void {
    const archived = store.getLegacyRecoveryJson()
    if (archived === null) return
    const blob = new Blob([archived], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'filament-theme-legacy-recovery.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return { restoreLegacyRecovery, downloadLegacyRecovery }
}
