import type { OperationNoticeDto } from '@/dtos/theme-relay.dto'
import type { useThemeStore } from '@/stores/theme'
import type { BrowserPayload, BrowserRelay } from '@/composables/use-theme-relay'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'

type ThemeStore = ReturnType<typeof useThemeStore>
type ImportHandoff = (payload: BrowserPayload, relay: BrowserRelay) => Promise<void>

export async function handleRelayNotices(notices: OperationNoticeDto[], relay: BrowserRelay, store: ThemeStore, importHandoff: ImportHandoff): Promise<void> {
  for (const notice of notices) {
    if (notice.status !== 'pending') continue
    try {
      if (notice.kind === 'import') await importHandoff(await relay.receivePayload(notice.operationId), relay)
      else if (notice.kind === 'list') await relay.publishListResult(notice.operationId, store.themes.map((theme) => ({
        id: theme.id, name: theme.name, updatedAt: theme.updatedAt, active: theme.id === store.activeThemeId,
      })))
      else await publishExport(notice, relay, store)
    } catch {
      await relay.reject(notice.operationId, notice.kind === 'import' ? 'invalid_theme' : 'theme_unavailable').catch(() => undefined)
    }
  }
}

async function publishExport(notice: OperationNoticeDto, relay: BrowserRelay, store: ThemeStore): Promise<void> {
  const state = notice.themeId ? store.getThemeState(notice.themeId) : null
  if (!state || state.customCss.trim()) { await relay.reject(notice.operationId, 'theme_unavailable'); return }
  const json = JSON.stringify(serializeCanonicalTheme(state))
  if (new TextEncoder().encode(json).byteLength > 1_048_576) { await relay.reject(notice.operationId, 'theme_unavailable'); return }
  await relay.publishExportResult(notice.operationId, json)
}
