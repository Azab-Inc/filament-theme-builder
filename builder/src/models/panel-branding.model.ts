import type { FontChoice } from '@/models/foundations.model'

export type PanelBrandingAsset = string

export type PanelContentWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'

export type PanelSidebarMode = 'collapsible' | 'fully-collapsible' | 'top-navigation'

export type PanelBrandingSettings = {
  appName: string
  lightLogo: PanelBrandingAsset | null
  darkLogo: PanelBrandingAsset | null
  favicon: PanelBrandingAsset | null
  logoHeight: string
  brandTypography: FontChoice
  contentWidth: PanelContentWidth
  sidebar: PanelSidebarMode
}

export type PanelBrandingSetting = keyof PanelBrandingSettings

export type PanelBrandingMapping = 'css-previewable' | 'runtime-refresh' | 'export-only'
