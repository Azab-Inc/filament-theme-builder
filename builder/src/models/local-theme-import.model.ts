import type { ThemeStateV4 } from '@/models/theme.model'
import type { LocalThemeRecord } from '@/models/local-theme.model'

export type ImportMarker = { digest: string; recordId: string; name: string; status: 'prepared' | 'complete' | 'failed' }
export type FreshThemeImport = { operationId: string; payloadDigest: string; state: ThemeStateV4; name: string }
export type ImportCommitResult = { ok: true; record: LocalThemeRecord } | { ok: false; error: string }
