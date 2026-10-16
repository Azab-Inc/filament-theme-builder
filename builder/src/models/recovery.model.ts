export type RecoveryStoreActions = Pick<{
  getLegacyRecoveryJson(): string | null
  restoreLegacyRecovery(): boolean
}, 'getLegacyRecoveryJson' | 'restoreLegacyRecovery'>
