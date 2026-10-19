import { shallowRef } from 'vue'
import type { BrowserPayload, BrowserRelay } from '@/composables/use-theme-relay'
import type { ThemeImportDialogHandle } from '@/models/theme-import-dialog.model'

export function useThemeRelayImportHandoff() {
  const dialog = shallowRef<ThemeImportDialogHandle | null>(null)
  async function receive(payload: BrowserPayload, relay: BrowserRelay): Promise<void> {
    if (!dialog.value) throw new Error('import_preview_unavailable')
    await dialog.value.receiveRelayPayload(payload, relay)
  }
  return { dialog, receive }
}
