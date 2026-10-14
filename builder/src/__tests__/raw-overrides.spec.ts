import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import type { InspectorTargetEvidence } from '@/services/inspector-protocol'
import { createThemeRegistry } from '@/registry/theme-registry'
import {
  ALL_RAW_VISUAL_PROPERTIES,
  proposeRawSelector,
  validateRawElementOverride,
  validateRawSelector,
} from '@/services/raw-override-validation'

const registry = createThemeRegistry()

const evidence = (candidateSelectors: string[]): InspectorTargetEvidence => ({
  candidateSelectors,
  classNames: candidateSelectors.map((selector) => selector.replace(/^\./, '').split(' ').join('-')),
  semanticBreadcrumb: 'Button / Primary',
})

describe('raw Inspector overrides', () => {
  it('keeps the bridge property allowlist in parity with the TypeScript allowlist', () => {
    const bridge = readFileSync(`${process.cwd()}/../demo/resources/views/filament/preview-bridge.blade.php`, 'utf8')

    for (const property of ALL_RAW_VISUAL_PROPERTIES) {
      expect(bridge).toContain(`'${property}'`)
    }
  })

  it('keeps supported pseudo-state selectors aligned with the production registry and preview bridge', () => {
    const bridge = readFileSync(`${process.cwd()}/../demo/resources/views/filament/preview-bridge.blade.php`, 'utf8')

    expect(bridge).toContain("const supportedPseudoStates = ['hover', 'focus']")
    expect(validateRawSelector('.fi-btn:hover').valid).toBe(true)
    expect(validateRawSelector('.fi-input:focus').valid).toBe(true)
    expect(validateRawSelector('.fi-btn:active').valid).toBe(false)
    expect(bridge).not.toContain('focus-visible')
    expect(bridge).not.toContain('focus-within')
  })

  it('prefers a single stable Filament class over a compound or structural candidate', () => {
    expect(proposeRawSelector(evidence(['.fi-btn > span', '.fi-btn.fi-color-primary', '.fi-btn']), registry)).toEqual({
      selector: '.fi-btn',
      quality: 'stable',
    })
  })

  it('marks safe compound selectors as fragile and rejects structural selectors', () => {
    expect(proposeRawSelector(evidence(['.fi-section .fi-btn']), registry)).toMatchObject({
      selector: '.fi-section .fi-btn',
      quality: 'fragile',
    })
    expect(validateRawSelector('.fi-section > div').valid).toBe(false)
  })

  it('accepts the complete typed visual property allowlist with representative values', () => {
    expect(ALL_RAW_VISUAL_PROPERTIES).toEqual(expect.arrayContaining([
      'color', 'background-color', 'border-color', 'border-width', 'border-radius',
      'box-shadow', 'opacity', 'padding', 'margin', 'font-family', 'font-size',
      'font-weight', 'line-height', 'letter-spacing', 'text-decoration',
      'border-style', 'text-align', 'white-space',
    ]))

    const result = validateRawElementOverride({
      selector: '.fi-btn',
      properties: {
        color: '#0f766e',
        'background-color': 'transparent',
        'border-color': 'rgb(15 118 110)',
        'border-width': '2px',
        'border-radius': '0.5rem',
        'box-shadow': '0 1px 2px rgb(0 0 0 / 0.2)',
        opacity: '0.8',
        padding: '0.5rem 1rem',
        margin: '0',
        'font-family': 'Inter, sans-serif',
        'font-size': '1rem',
        'font-weight': '600',
        'line-height': '1.5',
        'letter-spacing': '0.02em',
        'text-decoration': 'underline',
        'border-style': 'solid',
        'text-align': 'center',
        'white-space': 'nowrap',
      },
    })

    expect(result.valid).toBe(true)
  })

  it('rejects injection-shaped selectors and values', () => {
    expect(validateRawSelector('.fi-btn, .fi-input').valid).toBe(false)
    expect(validateRawSelector('.fi-btn[onclick]').valid).toBe(false)
    expect(validateRawElementOverride({
      selector: '.fi-btn',
      properties: { color: 'url(https://evil.test/x)' },
    }).valid).toBe(false)
    expect(validateRawElementOverride({
      selector: '.fi-btn',
      properties: { padding: '1rem; background: red' },
    }).valid).toBe(false)
    expect(validateRawElementOverride({
      selector: '.fi-btn',
      properties: { opacity: '2' },
    }).valid).toBe(false)
  })
})
