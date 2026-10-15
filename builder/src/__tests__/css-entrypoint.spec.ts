import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const builderRoot = resolve(process.cwd())

describe('builder CSS entrypoint', () => {
  it('loads app.css once from the main entry and keeps Vue styles external', () => {
    const mainSource = readFileSync(`${builderRoot}/src/main.ts`, 'utf8')
    const vueSources = [
      `${builderRoot}/src/App.vue`,
      `${builderRoot}/src/components/HoverInspectPrototype.vue`,
      `${builderRoot}/src/components/ThrowawayThemePrototype.vue`,
    ].map((path) => readFileSync(path, 'utf8'))

    expect(mainSource.match(/['"]\.\/app\.css['"]/g)).toHaveLength(1)
    expect(vueSources.some((source) => source.includes('<style'))).toBe(false)
  })
})
