import type { BuilderState } from './use-builder-state'
import type { ThemeStateV4 } from '@/models/theme.model'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'
import { exportIconConfigurationPhp } from '@/utils/icon-export'
import { exportPanelBrandingJson, exportPanelProviderBrandingPhp } from '@/utils/panel-branding-export'
import { exportVanillaCss } from '@/utils/vanilla-css-export'
import { downloadFile } from '@/utils/file-download'

export function useBuilderExports(state: BuilderState) {
  function exportCanonicalJson(): void { downloadFile('filament-theme.json', JSON.stringify(serializeCanonicalTheme(state.theme.theme), null, 2), 'application/json') }
  function exportIconPhp(): void { downloadFile('filament-panel-icon-config.php', exportIconConfigurationPhp(state.theme.theme.icons), 'text/plain') }
  function exportBrandingJson(): void { downloadFile('filament-panel-branding.json', exportPanelBrandingJson(state.theme.theme.branding), 'application/json') }
  function exportBrandingPhp(): void { downloadFile('filament-panel-branding.php', exportPanelProviderBrandingPhp(state.theme.theme.branding), 'text/plain') }
  function errorMessage(error: unknown): string { return `Vanilla CSS export failed: ${error instanceof Error ? error.message : 'Unknown export error'}` }
  function exportVanillaThemeCss(): void {
    try { const result = exportVanillaCss(state.theme.theme as unknown as ThemeStateV4); downloadFile('theme.css', result.css, 'text/css'); state.exportStatus.value = result.errors.length ? `Vanilla CSS exported with errors: ${result.errors.join('; ')}` : 'Vanilla CSS download started.' }
    catch (error) { state.exportStatus.value = errorMessage(error) }
  }
  async function copyVanillaThemeCss(): Promise<void> {
    let result: ReturnType<typeof exportVanillaCss>
    try { result = exportVanillaCss(state.theme.theme as unknown as ThemeStateV4) } catch (error) { state.exportStatus.value = errorMessage(error); return }
    const status = result.errors.length ? `Vanilla CSS copied with errors: ${result.errors.join('; ')}` : 'Vanilla CSS copied to clipboard.'
    try { await navigator.clipboard.writeText(result.css); state.exportStatus.value = status } catch {
      const textarea = document.createElement('textarea'); textarea.value = result.css; textarea.setAttribute('readonly', ''); textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.append(textarea); textarea.select()
      state.exportStatus.value = document.execCommand('copy') ? status : 'Copy failed; use Download CSS instead.'; textarea.remove()
    }
  }
  return { exportCanonicalJson, exportIconPhp, exportBrandingJson, exportBrandingPhp, exportVanillaThemeCss, copyVanillaThemeCss }
}
