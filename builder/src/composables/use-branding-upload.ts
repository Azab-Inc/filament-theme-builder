import type { PanelBrandingSetting } from '@/models/panel-branding.model'
import type { BuilderState } from './use-builder-state'
import type { BrandingUploadResponseDto } from '@/dtos/branding-upload-response.dto'

export function useBrandingUpload(state: BuilderState) {
  async function uploadBrandingAsset(setting: PanelBrandingSetting, event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    const form = new FormData(); form.append('asset', file)
    const response = await fetch('/api/branding-assets', { method: 'POST', body: form, credentials: 'same-origin' })
    if (!response.ok) { state.uploadErrors.value[setting] = 'Upload rejected. Use a JPEG, PNG, or WebP image within the temporary quota.'; return }
    const payload = await response.json() as BrandingUploadResponseDto
    if (typeof payload.reference !== 'string') { state.uploadErrors.value[setting] = 'Upload response did not contain a safe reference.'; return }
    delete state.uploadErrors.value[setting]; state.theme.setBrandingSetting(setting, payload.reference)
  }
  return { uploadBrandingAsset }
}
