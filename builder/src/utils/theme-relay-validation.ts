import type { OperationNoticeDto } from '@/dtos/theme-relay.dto'

export function isRelayOperationNotice(notice: OperationNoticeDto): boolean {
  return !!notice && /^[a-f0-9]{64}$/.test(notice.operationId)
    && ['list', 'export', 'import'].includes(notice.kind)
    && ['pending', 'approved', 'rejected', 'expired', 'disconnected'].includes(notice.status)
    && (notice.themeId === undefined || typeof notice.themeId === 'string')
}
