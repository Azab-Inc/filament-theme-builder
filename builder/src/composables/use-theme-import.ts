import { shallowReactive } from 'vue'
import type { useThemeStore } from '@/stores/theme'
import type { ThemeImportUi } from '@/models/theme-import-ui.model'
import { MAX_THEME_IMPORT_BYTES, previewThemeImport } from '@/utils/theme-import-service'
import { createThemeRegistry } from '@/registry/theme-registry'

type ThemeStore = ReturnType<typeof useThemeStore>

export function useThemeImport(store: ThemeStore): ThemeImportUi {
  const state = shallowReactive({ preview: null, filename: '', proposedName: '', error: null, open: false }) as ThemeImportUi['state']
  async function chooseFile(file: File): Promise<void> {
    state.open = true; state.preview = null; state.filename = file.name; state.error = null
    const fallback = file.name.split(/[\\/]/).pop()?.replace(/\.json$/i, '').trim() || 'Untitled'
    state.proposedName = fallback
    if (file.size > MAX_THEME_IMPORT_BYTES) { state.error = 'Theme import exceeds the 1 MiB limit'; return }
    try {
      const result = await previewThemeImport(new Uint8Array(await file.arrayBuffer()), file.name, fallback, createThemeRegistry())
      if (result.valid) state.preview = result.preview
      else state.error = result.message
    } catch { state.error = 'Unable to read or preview this theme file' }
  }
  async function confirm() {
    if (!state.preview) return { ok: false as const, error: 'Choose a valid theme file first' }
    const operationId = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('')
    const result = store.importFreshTheme({ operationId, payloadDigest: state.preview.payloadDigest, state: state.preview.state, name: state.proposedName })
    if (result.ok) state.open = false
    else state.error = result.error
    return result
  }
  return { state, chooseFile, setName: (name) => { state.proposedName = name }, confirm, cancel: () => { state.open = false; state.preview = null; state.error = null } }
}
