import type { BrandingAssetUpload } from '@/dtos/branding-asset-upload.dto'
import type { BrandingSettingChange } from '@/models/branding-setting-change.model'

export type BrandingSettingsPanelEmits = {
  (event: 'changeBranding', change: BrandingSettingChange): void
  (event: 'uploadAsset', payload: BrandingAssetUpload): void
  (event: 'setBrandTypography', eventValue: Event): void
  (event: 'setCustomBrandTypography', eventValue: Event): void
  (event: 'resetBranding'): void
}
