import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourceRoot = join(process.cwd(), 'src')
const migratedModules = [
  'foundation-defaults',
  'foundation-recovery',
  'foundation-projection',
  'foundation-provenance',
  'foundation-validation',
  'icon-export',
  'inspector-protocol',
  'palette-generator',
  'panel-branding-export',
  'panel-branding-validation',
  'raw-override-validation',
  'theme-resolver',
  'theme-serialization',
  'theme-validation',
  'vanilla-css-export',
] as const

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

describe('pure service migration source graph', () => {
  it('leaves no imports of migrated services in the source graph', () => {
    const serviceImport = new RegExp(`from\\s+['"]@/services/(${migratedModules.join('|')})(?:\\.ts)?['"]`)
    const references = sourceFiles(sourceRoot)
      .filter((path) => /\.(ts|vue)$/.test(path))
      .flatMap((path) => {
        const content = readFileSync(path, 'utf8')
        return serviceImport.test(content) ? [path] : []
      })

    expect(references).toEqual([])
  })
})
