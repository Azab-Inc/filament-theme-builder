import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const builderRoot = resolve(process.cwd())

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
    expect(cssSource).toContain('@import "tailwindcss/theme.css" layer(theme);')
    expect(cssSource).toContain('@import "tailwindcss/utilities.css" layer(utilities);')
    expect(cssSource.match(/@import\s+["']tailwindcss\/[^"']+["']/g)).toEqual([
      '@import "tailwindcss/theme.css"',
      '@import "tailwindcss/utilities.css"',
    ])
    expect(packageSource).toMatch(/"tailwindcss"\s*:\s*"\^4\.3\.3"/)
    expect(packageSource).toMatch(/"@tailwindcss\/vite"\s*:\s*"\^4\.3\.3"/)
    expect(lockSource).toMatch(/"node_modules\/tailwindcss":\s*\{\s*"version": "4\.3\.3"/)
    expect(lockSource).toMatch(/"node_modules\/@tailwindcss\/vite":\s*\{\s*"version": "4\.3\.3"/)
    expect(viteSource).toContain('tailwindcss()')
    expect(vueSources.some((source) => source.includes('<style'))).toBe(false)
  })
})
