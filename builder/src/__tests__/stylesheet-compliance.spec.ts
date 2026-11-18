import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const stylesRoot = resolve(process.cwd(), 'src/styles')
const reducedMotionPattern = /@media\s*\(prefers-reduced-motion:\s*reduce\)/
const colorLiteralPattern = /(?:#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(|\b(?:red|blue|green|white|black|gray|grey)\b)/i

const files = () => readdirSync(stylesRoot).filter((file) => file.endsWith('.css'))

const selectorDeclarations = (source: string) => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/@(?:media|container|supports)[^{]*\{/g, '')
  .split(/\n(?=[.#\[:@])/)
  .filter((block) => !block.trim().startsWith('@theme') && !block.trim().startsWith('@utility') && !block.trim().startsWith('@layer'))

describe('builder stylesheet compliance', () => {
  it('keeps tokens as the sole theme source and imports them first', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf8')
    expect(files().filter((file) => /@theme\b/.test(readFileSync(resolve(stylesRoot, file), 'utf8')))).toEqual(['tokens.css'])
    expect(css.indexOf('@import "./styles/tokens.css"')).toBeGreaterThan(css.indexOf('tailwindcss/utilities.css'))
    expect(css.indexOf('@import "./styles/tokens.css"')).toBeLessThan(css.indexOf('@import "./styles/editor-shell.css"'))
  })

  it('uses semantic token names instead of generated selector paths', () => {
    const tokenSource = readFileSync(resolve(stylesRoot, 'tokens.css'), 'utf8')
    const tokenNames = [...tokenSource.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((match) => match[1]!).filter(Boolean)

    expect(tokenNames.filter((name) => name.includes('--builder-'))).toEqual([])
    expect(tokenNames.filter((name) => /[0-9a-f]{6,}/i.test(name))).toEqual([])
    expect(tokenNames.filter((name) => /aria|vp-|field-|surface-row|preview-shell|prototype-/i.test(name))).toEqual([])
  })

  it('does not scatter color literals or ordinary declarations', () => {
    for (const file of files()) {
      const source = readFileSync(resolve(stylesRoot, file), 'utf8')
      if (file !== 'tokens.css') expect(source).not.toMatch(colorLiteralPattern)
      for (const block of selectorDeclarations(source)) {
        const withoutApplyUtilities = block.replace(/@apply\s+[^;]+/g, '')
        expect(withoutApplyUtilities, `${file} contains a raw selector declaration`).not.toMatch(/\b(?:color|background|border|padding|margin|width|height|display|position|font|outline|box-shadow)\s*:/)
      }
    }
  })

  it('allows important only inside reduced-motion blocks and references component styles', () => {
    for (const file of files()) {
      const source = readFileSync(resolve(stylesRoot, file), 'utf8')
      if (source.includes('!important')) expect(reducedMotionPattern.test(source)).toBe(true)
      if (['dashboard-prototype.css', 'guidelines-prototype.css'].includes(file)) expect(source).toContain('@reference "../app.css";')
    }
  })
})
