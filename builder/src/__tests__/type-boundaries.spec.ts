import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const sourceRoot = resolve(process.cwd(), 'src')

describe('shared editor type boundaries', () => {
  it('keeps editor navigation and section types in a dedicated model', () => {
    const model = readFileSync(`${sourceRoot}/models/editor.model.ts`, 'utf8')
    const app = readFileSync(`${sourceRoot}/App.vue`, 'utf8')
    const inspector = readFileSync(`${sourceRoot}/composables/use-inspector.ts`, 'utf8')

    expect(model).toContain("export type EditorNavigationMode = 'sidebar' | 'top'")
    expect(model).toContain("export type EditorSection = 'foundations' | 'components' | 'branding' | 'icons' | 'inspector'")
    expect(app).toContain("from '@/models/editor.model'")
    expect(inspector).toContain("from '@/models/editor.model'")
    expect(app).not.toMatch(/type\s+EditorNavigationMode\s*=/)
    expect(app).not.toMatch(/type\s+EditorSection\s*=/)
    expect(inspector).not.toMatch(/type\s+EditorSection\s*=/)
  })

  it('keeps surface-control domain and component contract types in dedicated boundaries', () => {
    const foundations = readFileSync(`${sourceRoot}/models/foundations.model.ts`, 'utf8')
    const modeValueChange = readFileSync(`${sourceRoot}/dtos/foundation-mode-value-change.dto.ts`, 'utf8')
    const props = readFileSync(`${sourceRoot}/dtos/foundations-surface-controls-props.dto.ts`, 'utf8')
    const emits = readFileSync(`${sourceRoot}/dtos/foundations-surface-controls-emits.dto.ts`, 'utf8')
    const compatibility = readFileSync(`${sourceRoot}/components/foundations-surface-controls.model.ts`, 'utf8')
    const component = readFileSync(`${sourceRoot}/components/FoundationsSurfaceControls.vue`, 'utf8')

    expect(foundations).toContain("export type FoundationSurfaceName = keyof FoundationState['surfaces']")
    expect(foundations).toContain("export type FoundationBorderName = keyof FoundationState['borders']")
    expect(foundations).toContain("export type FoundationTextName = keyof FoundationState['text']")
    expect(modeValueChange).toContain('export type FoundationModeValueChange =')
    expect(props).toContain('export type FoundationsSurfaceControlsProps =')
    expect(emits).toContain('export type FoundationsSurfaceControlsEmits =')
    expect(component).toContain("from '@/dtos/foundations-surface-controls-props.dto'")
    expect(component).toContain("from '@/dtos/foundations-surface-controls-emits.dto'")
    expect(compatibility.trim()).toBe(
      "export type { FoundationModeValueChange } from '@/dtos/foundation-mode-value-change.dto'",
    )
  })

  it('keeps theme validation result types in dedicated model files', () => {
    const validation = readFileSync(`${sourceRoot}/utils/theme-validation.ts`, 'utf8')
    const modelFiles = [
      'theme-validation-context.model.ts',
      'theme-override-validation-failure.model.ts',
      'theme-override-validation-result.model.ts',
      'theme-state-validation-result.model.ts',
      'resolve-request-validation-result.model.ts',
    ]

    expect(validation).not.toMatch(/export\s+type\s+(ThemeValidationContext|ThemeOverrideValidationFailure|ThemeOverrideValidationResult|ThemeStateValidationResult|ResolveRequestValidationResult)\b/)
    for (const file of modelFiles) {
      expect(readFileSync(`${sourceRoot}/models/${file}`, 'utf8')).toMatch(/export type /)
    }
  })
})
