import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const storePath = resolve(process.cwd(), 'src/stores/theme.ts')

describe('theme store boundary', () => {
  it('keeps the Pinia façade focused and any-free', () => {
    const source = readFileSync(storePath, 'utf8')

    expect(source.split('\n').length).toBeLessThanOrEqual(101)
    expect(source).not.toMatch(/\bany\b/)
  })
})
