export type RelayBootstrapDto = {
  version: 1
  origin: string
  host: string
  csrfToken: string
  enabled: true
}

export type PairingCreatedDto = {
  version: 1
  pairingId: string
  status: 'pending'
  expiresAt: number
}

export type PairingStatusDto = {
  version: 1
  pairingId: string
  status: 'pending' | 'approved' | 'expired' | 'disconnected'
  expiresAt: number
  claimId?: string
  sessionId?: string
  sessionExpiresAt?: number
  clientLabel?: string
}

export type OperationResultStatusDto = {
  version: 1
  operationId: string
  kind: 'list' | 'export' | 'import'
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'disconnected'
  recordId?: string
  errorCategory?: string
}

export type OperationNoticeDto = { operationId: string; kind: 'list' | 'export' | 'import'; status: OperationResultStatusDto['status']; themeId?: string }
export type RelayPayloadDto = { version: 1; operationId: string; payload: string; filename: string; proposedName: string; digest: string; byteLength: number }
export type ImportPreviewDto = { sourceVersion: 1 | 2 | 3 | 4; targetVersion: 4; migrationPath: number[]; displayName: string; summary: string[]; payloadDigest: string; byteLength: number }
export type ApplyGrantDto = { version: 1; status: 'pending'; grantId: string; grantExpiresAt: number }
