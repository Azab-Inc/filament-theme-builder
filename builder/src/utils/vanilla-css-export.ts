import type { ThemeMode } from '@/models/foundations.model'
import type { ThemeStateInput, ThemeStateV5 } from '@/models/theme.model'
import type { VanillaCssExportResult } from '@/models/vanilla-css-export-result.model'
import { renderFoundations, renderDarkFoundations } from '@/utils/vanilla-css-export-foundations'
import { renderRawOverrides } from '@/utils/vanilla-css-export-raw-overrides'
import { renderSemanticOverrides } from '@/utils/vanilla-css-export-semantic-overrides'

export function exportVanillaCss(theme: Readonly<ThemeStateInput | ThemeStateV5>): VanillaCssExportResult {
  const canonical = theme
  const errors: string[] = []
  const sections = [
    '/* Generated with Filament Theme Builder */',
    '',
    '/* Foundations */',
    renderFoundations(canonical, 'light'),
    renderDarkFoundations(canonical),
    '',
    '/* Semantic overrides */',
    renderSemanticOverrides(canonical, errors),
    '',
    '/* Advanced raw-element overrides */',
    renderRawOverrides(canonical, errors),
    '',
  ]
  return { css: sections.filter((section, index) => section !== '' || index > 0).join('\n'), errors }
}
