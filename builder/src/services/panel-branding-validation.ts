import type { FontChoice } from '@/models/foundations.model'
import type { PanelBrandingSetting, PanelBrandingSettings, PanelContentWidth, PanelSidebarMode, PanelBrandingMapping } from '@/models/panel-branding.model'

const CONTENT_WIDTHS: readonly PanelContentWidth[] = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']
const SIDEBAR_MODES: readonly PanelSidebarMode[] = ['collapsible', 'fully-collapsible', 'top-navigation']
const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
const SAFE_ASSET = /^[a-f0-9]{64}\/[a-f0-9]{40}\.(?:jpg|jpeg|png|webp)$/i
const SAFE_TEXT = /^[\p{L}\p{N} .,_&'’()\-]{1,100}$/u
const SAFE_LENGTH = /^(?:0|[1-9]\d?)(?:\.\d+)?(?:px|rem|em|vh|vw|%)$/

export function createDefaultPanelBrandingSettings(): PanelBrandingSettings {
  return {
    appName: 'Filament Theme Builder',
    lightLogo: null,
    darkLogo: null,
    favicon: null,
    logoHeight: '2.5rem',
    brandTypography: { kind: 'system', name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' },
    contentWidth: '7xl',
    sidebar: 'collapsible',
  }
}

export function validatePanelBrandingSettings(value: unknown): { valid: true; settings: PanelBrandingSettings } | { valid: false; path: string; message: string } {
  if (!isRecord(value)) return invalid('', 'Branding settings must be an object.')
  const keys = ['appName', 'lightLogo', 'darkLogo', 'favicon', 'logoHeight', 'brandTypography', 'contentWidth', 'sidebar']
  if (Object.keys(value).some((key) => !keys.includes(key)) || keys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))) return invalid('', 'Branding settings contain unsupported keys.')
  if (typeof value.appName !== 'string' || !SAFE_TEXT.test(value.appName)) return invalid('appName', 'App name contains unsupported characters.')
  for (const key of ['lightLogo', 'darkLogo', 'favicon']) {
    const asset = value[key]
    if (asset !== null && (typeof asset !== 'string' || !SAFE_ASSET.test(asset))) return invalid(key, 'Asset reference is unsafe.')
  }
  if (typeof value.logoHeight !== 'string' || !SAFE_LENGTH.test(value.logoHeight)) return invalid('logoHeight', 'Logo height must be a CSS length.')
  if (!validateFont(value.brandTypography)) return invalid('brandTypography', 'Typography is unsupported.')
  if (typeof value.contentWidth !== 'string' || !CONTENT_WIDTHS.includes(value.contentWidth as PanelContentWidth)) return invalid('contentWidth', 'Content width is unsupported.')
  if (typeof value.sidebar !== 'string' || !SIDEBAR_MODES.includes(value.sidebar as PanelSidebarMode)) return invalid('sidebar', 'Sidebar mode is unsupported.')
  return { valid: true, settings: structuredClone(value) as PanelBrandingSettings }
}

export function classifyPanelBrandingSetting(setting: PanelBrandingSetting): PanelBrandingMapping {
  if (setting === 'logoHeight') return 'css-previewable'
  if (setting === 'favicon') return 'export-only'
  return 'runtime-refresh'
}

function validateFont(value: unknown): value is FontChoice {
  if (!isRecord(value) || !['system', 'curated', 'custom'].includes(String(value.kind)) || typeof value.name !== 'string' || typeof value.family !== 'string') return false
  if (value.family !== SYSTEM_MONO && !/^[A-Za-z0-9][A-Za-z0-9 .,_'"-]{0,99}$/.test(value.family)) return false
  if (value.kind === 'curated') return value.provider === 'google-fonts' && ['Inter', 'Roboto'].includes(value.name) && value.name === value.family
  return value.kind === 'custom' ? value.name === value.family : value.name === 'System' || value.name === 'System Mono'
}

function invalid(path: string, message: string): { valid: false; path: string; message: string } {
  return { valid: false, path, message }
}

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
