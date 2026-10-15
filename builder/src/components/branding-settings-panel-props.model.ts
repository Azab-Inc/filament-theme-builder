import type { BrandingAssetSetting } from '@/models/branding-asset-setting.model'
import type { PanelBrandingSettings } from '@/models/panel-branding.model'

export type BrandingSettingsPanelProps = {
  active: boolean
  branding: PanelBrandingSettings
  uploadErrors: Partial<Record<BrandingAssetSetting, string>>
}
