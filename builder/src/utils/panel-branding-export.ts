import type { PanelBrandingSettings } from '@/models/panel-branding.model'

export function exportPanelBrandingJson(settings: PanelBrandingSettings): string {
  return `${JSON.stringify({ schemaVersion: 1, branding: settings }, null, 2)}\n`
}

export function exportPanelProviderBrandingPhp(settings: PanelBrandingSettings): string {
  const lines = [
    `->brandName(${phpString(settings.appName)})`,
    `->brandLogo(${assetExpression(settings.lightLogo)})`,
    `->darkModeBrandLogo(${assetExpression(settings.darkLogo)})`,
    `->brandLogoHeight(${phpString(settings.logoHeight)})`,
    `->favicon(${assetExpression(settings.favicon)})`,
    `// Brand typography (${settings.brandTypography.name}) should be loaded through the app's approved Google Fonts stylesheet.`,
    `->maxContentWidth(${phpString(settings.contentWidth)})`,
  ]
  if (settings.sidebar === 'collapsible') lines.push('->sidebarCollapsibleOnDesktop()')
  if (settings.sidebar === 'fully-collapsible') lines.push('->sidebarFullyCollapsibleOnDesktop()')
  if (settings.sidebar === 'top-navigation') lines.push('->topNavigation()')
  return `${lines.join('\n')}\n`
}

function assetExpression(asset: string | null): string {
  return asset === null ? 'null' : `storage_path(${phpString(`app/temporary-uploads/${asset}`)})`
}

function phpString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}
