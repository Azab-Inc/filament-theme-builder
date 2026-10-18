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
