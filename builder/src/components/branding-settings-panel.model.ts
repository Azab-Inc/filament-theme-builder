import type { PanelBrandingSetting, PanelBrandingSettings } from '../models/panel-branding.model'

export type BrandingSettingChange = {
  [Setting in PanelBrandingSetting]: { setting: Setting; value: PanelBrandingSettings[Setting] }
}[PanelBrandingSetting]
export type BrandingAssetSetting = Extract<PanelBrandingSetting, 'lightLogo' | 'darkLogo' | 'favicon'>
export type BrandingAssetUpload = { setting: BrandingAssetSetting; event: Event }

export type BrandingSettingsPanelProps = {
  active: boolean
  branding: PanelBrandingSettings
  uploadErrors: Partial<Record<BrandingAssetSetting, string>>
}

export type BrandingSettingsPanelEmits = {
  (event: 'changeBranding', change: BrandingSettingChange): void
  (event: 'uploadAsset', payload: BrandingAssetUpload): void
  (event: 'setBrandTypography', eventValue: Event): void
  (event: 'setCustomBrandTypography', eventValue: Event): void
  (event: 'resetBranding'): void
}
