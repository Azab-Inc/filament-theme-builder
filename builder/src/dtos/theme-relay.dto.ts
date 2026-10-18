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
}

export type OperationResultStatusDto = {
  version: 1
  operationId: string
  kind: 'list' | 'export' | 'import'
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'disconnected'
  recordId?: string
  errorCategory?: string
}
