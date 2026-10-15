import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const builderRoot = resolve(process.cwd())

const cssBlocks = [
  {
    path: 'src/styles/editor-shell.css',
    lines: 99,
    sha256: 'd7670a093626e287bf86c53383807cef7663a8108cff25c6f98b6bb89d7e052f',
  },
  {
    path: 'src/styles/editor-navigation.css',
    lines: 45,
    sha256: '9f5a20b3d9b3269c5d18bc92df29329154e78557bcbe2667bd6567fd905197a3',
  },
  {
    path: 'src/styles/editor-responsive.css',
    lines: 59,
    sha256: 'b2cb41220e4a75c811f5e4fe5419fac404e86930abe6c9c326293837c2ea5298',
  },
  {
    path: 'src/styles/editor-mobile.css',
    lines: 51,
    sha256: '7b59defff31cc9f2f86878b82e28eaeaf71b87ec232b72e75b524e0b50d278fa',
  },
  {
    path: 'src/styles/inspect-prototype.css',
    lines: 12,
    sha256: 'eb30ca9ea6cec8be6855a9eadfbe3a9e8d51871069765d553d13ad82e575d9c8',
  },
  {
    path: 'src/styles/theme-prototype.css',
    lines: 3,
    sha256: 'c72ed2b32e260666b71e669dade7a260cdab03a8d9d8245a2af46db159eda239',
  },
] as const

const sha256 = (source: Buffer) => createHash('sha256').update(source).digest('hex')

describe('builder CSS entrypoint', () => {
  it('loads app.css once from the main entry and keeps Vue styles external', () => {
    const mainSource = readFileSync(`${builderRoot}/src/main.ts`, 'utf8')
    const cssSource = readFileSync(`${builderRoot}/src/app.css`, 'utf8')
    const packageSource = readFileSync(`${builderRoot}/package.json`, 'utf8')
    const lockSource = readFileSync(`${builderRoot}/package-lock.json`, 'utf8')
    const viteSource = readFileSync(`${builderRoot}/vite.config.ts`, 'utf8')
    const vueSources = [
      `${builderRoot}/src/App.vue`,
      `${builderRoot}/src/components/HoverInspectPrototype.vue`,
      `${builderRoot}/src/components/ThrowawayThemePrototype.vue`,
    ].map((path) => readFileSync(path, 'utf8'))

    expect(mainSource.match(/['"]\.\/app\.css['"]/g)).toHaveLength(1)
    expect(cssSource.trim().split('\n')).toEqual([
      '@import "tailwindcss/theme.css" layer(theme);',
      '@import "tailwindcss/utilities.css" layer(utilities);',
      '@import "./styles/editor-shell.css";',
      '@import "./styles/editor-navigation.css";',
      '@import "./styles/editor-responsive.css";',
      '@import "./styles/editor-mobile.css";',
      '@import "./styles/inspect-prototype.css";',
      '@import "./styles/theme-prototype.css";',
    ])
    expect(cssSource.match(/@import\s+["']tailwindcss\/[^"']+["']/g)).toEqual([
      '@import "tailwindcss/theme.css"',
      '@import "tailwindcss/utilities.css"',
    ])
    expect(cssSource.split('\n').length - 1).toBeLessThanOrEqual(100)
    for (const block of cssBlocks) {
      const source = readFileSync(`${builderRoot}/${block.path}`)
      expect(source.toString().split('\n').length - 1).toBe(block.lines)
      expect(sha256(source)).toBe(block.sha256)
    }
    expect(packageSource).toMatch(/"tailwindcss"\s*:\s*"\^4\.3\.3"/)
    expect(packageSource).toMatch(/"@tailwindcss\/vite"\s*:\s*"\^4\.3\.3"/)
    expect(lockSource).toMatch(/"node_modules\/tailwindcss":\s*\{\s*"version": "4\.3\.3"/)
    expect(lockSource).toMatch(/"node_modules\/@tailwindcss\/vite":\s*\{\s*"version": "4\.3\.3"/)
    expect(viteSource).toContain('tailwindcss()')
    expect(vueSources.some((source) => source.includes('<style'))).toBe(false)
  })
})
