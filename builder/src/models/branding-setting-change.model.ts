import type { PanelBrandingSetting, PanelBrandingSettings } from '@/models/panel-branding.model'

export type BrandingSettingChange = {
  [Setting in PanelBrandingSetting]: { setting: Setting; value: PanelBrandingSettings[Setting] }
}[PanelBrandingSetting]
