import type { ImportVersion } from '@/models/theme-import.model'
import type { ThemeStateV5 } from '@/models/theme.model'
import type { ImportCommitResult } from '@/models/local-theme-import.model'
import type { ApplyGrantDto } from '@/dtos/theme-relay.dto'

export type VerifiedApplyGrant = ApplyGrantDto & { operationId: string; digest: string; revision: number; displayName: string }

export type ApprovedImport = {
  operationId: string
  payloadDigest: string
  rawBytes: Uint8Array
  filename: string
  sourceProposedName: string
  proposedName: string
  sourceVersion: ImportVersion
  state: ThemeStateV5
  expectedRevision: number
  grant: VerifiedApplyGrant
  operationExpiresAt: number
}
export type ThemeStoreImportBoundary = {
  revision: number
  importFreshTheme(input: { operationId: string; payloadDigest: string; state: ThemeStateV5; name: string }): ImportCommitResult
}
