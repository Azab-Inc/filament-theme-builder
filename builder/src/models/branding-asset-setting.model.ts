import type { PanelBrandingSetting } from '@/models/panel-branding.model'

export type BrandingAssetSetting = Extract<PanelBrandingSetting, 'lightLogo' | 'darkLogo' | 'favicon'>
