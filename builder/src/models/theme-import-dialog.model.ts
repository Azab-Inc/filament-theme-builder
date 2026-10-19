import type { BrowserPayload, BrowserRelay } from '@/composables/use-theme-relay'

export type ThemeImportDialogHandle = { receiveRelayPayload(payload: BrowserPayload, relay: BrowserRelay): Promise<void> }
