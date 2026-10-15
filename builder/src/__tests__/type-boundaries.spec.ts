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
})
