export type BrandingAssetSetting = 'lightLogo' | 'darkLogo' | 'favicon'

export type BrandingAssetFieldProps = {
  setting: BrandingAssetSetting
  label: string
  value: string | null
  error?: string
}

export type BrandingAssetFieldEmits = {
  upload: [change: { setting: BrandingAssetSetting; event: Event }]
  update: [change: { setting: BrandingAssetSetting; value: string | null }]
}
