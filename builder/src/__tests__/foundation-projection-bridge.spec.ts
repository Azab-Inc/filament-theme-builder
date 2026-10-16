import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('foundation projection bridge contracts', () => {
  it('requires bridge compatibility handling for forged tuples and unmapped modes', () => {
    const bridge = readFileSync(
      resolve(repositoryRoot, 'demo/resources/views/filament/preview-bridge.blade.php'),
      'utf8',
    )

    expect(bridge).toContain('isSafeOverride')
    expect(bridge).toContain('sameArray(candidate.selectors, expected.selectors)')
    expect(bridge).toContain('projection.mappings')
    expect(bridge).toContain('ftb:preview-message-accepted')
    expect(bridge).not.toContain('ftb:preview-compatibility')
  })

  it('requires the bridge to bind sparse projections to canonical values and active mode', () => {
    const bridge = readFileSync(
      resolve(repositoryRoot, 'demo/resources/views/filament/preview-bridge.blade.php'),
      'utf8',
    )

    expect(bridge).toContain('projectionMatchesCanonicalFoundation')
    expect(bridge).toContain('projection.mode')
    expect(bridge).toContain('foundationValue')
    expect(bridge).toContain('explicitPaths')
    expect(bridge).toContain('canonicalFoundationMappings.size')
    expect(bridge).toContain('expectedMappings.length')
  })
})
