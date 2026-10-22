import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createThemeRegistry } from '@/registry/theme-registry'

const root = resolve(import.meta.dirname, '../../..')

describe('padding catalog packaging', () => {
  it('uses the same neutral catalog for TypeScript and the PHP resource path', () => {
    const canonical = readFileSync(resolve(root, 'builder/src/registry/filament-padding-targets.json'), 'utf8')
    const php = readFileSync(resolve(root, 'demo/resources/theme-registry/filament-padding-targets.json'), 'utf8')
    expect(JSON.parse(php)).toEqual(JSON.parse(canonical))
    expect(createThemeRegistry().entries.flatMap((entry) => entry.paddingTargets ?? []).length).toBeGreaterThan(0)
  })

  it('pins both Compose runtimes to the single catalog path', () => {
    const dev = readFileSync(resolve(root, 'compose.dev.yaml'), 'utf8')
    const prod = readFileSync(resolve(root, 'Dockerfile'), 'utf8')
    expect(dev).toContain('./builder/src/registry/filament-padding-targets.json:/var/www/html/resources/theme-registry/filament-padding-targets.json:ro')
    expect(prod).toContain('COPY builder/src/registry/filament-padding-targets.json resources/theme-registry/filament-padding-targets.json')
  })
})
