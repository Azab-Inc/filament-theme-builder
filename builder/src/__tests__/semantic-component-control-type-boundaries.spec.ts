import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const sourceRoot = resolve(process.cwd(), 'src')

describe('semantic component control type boundaries', () => {
  it('exports each type from its dedicated file and compatibility barrel', () => {
    const modelCompatibility = readFileSync(
      `${sourceRoot}/components/semantic-component-controls.model.ts`,
      'utf8',
    )
    const dtoCompatibility = readFileSync(
      `${sourceRoot}/components/semantic-component-controls.dto.ts`,
      'utf8',
    )
    const typeFiles = [
      ['models/semantic-component-target.model.ts', 'SemanticComponentTarget'],
      ['models/semantic-component-scope.model.ts', 'SemanticComponentScope'],
      ['models/semantic-component-row.model.ts', 'SemanticComponentRow'],
      ['dtos/semantic-component-controls-props.dto.ts', 'SemanticComponentControlsProps'],
      ['dtos/semantic-component-value-change.dto.ts', 'SemanticComponentValueChange'],
      ['dtos/semantic-component-reset.dto.ts', 'SemanticComponentReset'],
    ] as const

    for (const [file, name] of typeFiles) {
      expect(readFileSync(`${sourceRoot}/${file}`, 'utf8')).toMatch(
        new RegExp(`export type ${name}\\b`),
      )
      const compatibility =
        file.startsWith('models/') || name === 'SemanticComponentControlsProps'
          ? modelCompatibility
          : dtoCompatibility
      expect(compatibility).toContain(`export type { ${name} }`)
    }
  })
})
