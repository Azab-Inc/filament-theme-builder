import type { ImportPreview } from '@/models/theme-import.model'
import type { ImportCommitResult } from '@/models/local-theme-import.model'
import type { BrowserPayload, BrowserRelay } from '@/composables/use-theme-relay'

export type ThemeImportUiState = {
  preview: ImportPreview | null
  filename: string
  proposedName: string
  error: string | null
  open: boolean
  applying: boolean
  canCancel: boolean
}
export type ThemeImportUi = {
  state: ThemeImportUiState
  chooseFile(file: File): Promise<void>
  receiveRelayPayload(payload: BrowserPayload, relay: BrowserRelay): Promise<void>
  setName(name: string): void
  confirm(): Promise<ImportCommitResult>
  cancel(): void
}
