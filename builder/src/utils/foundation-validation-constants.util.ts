import { CURATED_FONT_CHOICES, PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'

export const SURFACE_KEYS = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
export const BORDER_KEYS = ['default', 'strong'] as const
export const TEXT_KEYS = ['primary', 'muted', 'disabled'] as const
export const FONT_KEYS = ['body', 'heading', 'mono'] as const
export const DENSITIES = ['compact', 'default', 'spacious'] as const
export const RADII = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
export const SHADOWS = ['none', 'sm', 'md', 'lg', 'xl'] as const
export const SPACING_KEYS = ['0', 'px', '0.5', '1', '1.5', '2', '3', '4', '6', '8'] as const
export const SAFE_FONT_FAMILY = /^[A-Za-z0-9][A-Za-z0-9 .,_-]*$/
export const SYSTEM_MONO_FALLBACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

export const KNOWN_EXPLICIT_PATHS = new Set<string>([
  ...PALETTE_NAMES.flatMap((name) => [
    `palettes.${name}.base`,
    ...PALETTE_SHADES.map((shade) => `palettes.${name}.overrides.${shade}`),
  ]),
  ...['surfaces.page', 'surfaces.sidebar', 'surfaces.topbar', 'surfaces.card', 'surfaces.elevated', 'surfaces.input', 'borders.default', 'borders.strong', 'text.primary', 'text.muted', 'text.disabled'].flatMap((path) => [`${path}.light`, `${path}.dark`]),
  ...['body', 'heading', 'mono'].map((name) => `typography.${name}`),
  ...SPACING_KEYS.map((key) => `spacing.${key}`),
  'density', 'radius', 'borderWidth', 'shadow',
])

export { CURATED_FONT_CHOICES }
