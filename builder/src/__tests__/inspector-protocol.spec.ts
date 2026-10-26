import { describe, expect, it } from 'vitest'

import { createThemeRegistry, resolveInspectorTarget } from '@/registry/theme-registry'
import {
  INSPECTOR_PROTOCOL_VERSION,
  isInspectorCommand,
  isInspectorEvent,
  type InspectorTargetEvidence,
} from '@/utils/inspector-protocol'

const registry = createThemeRegistry()

const evidence = (overrides: Partial<InspectorTargetEvidence> = {}): InspectorTargetEvidence => ({
  candidateSelectors: ['.fi-fo-text-input .fi-input'],
  classNames: ['fi-input'],
  ...overrides,
})

describe('inspector protocol', () => {
  it('accepts only versioned enable and disable commands', () => {
    expect(isInspectorCommand({ type: 'ftb:inspector:enable', protocolVersion: INSPECTOR_PROTOCOL_VERSION })).toBe(true)
    expect(isInspectorCommand({ type: 'ftb:inspector:disable', protocolVersion: INSPECTOR_PROTOCOL_VERSION })).toBe(true)
    expect(isInspectorCommand({ type: 'ftb:inspector:enable', protocolVersion: 2 })).toBe(false)
    expect(isInspectorCommand({ type: 'ftb:inspector:enable', protocolVersion: 1, selector: '.unsafe' })).toBe(false)
  })

  it('rejects unsafe selector evidence and malformed inspector events', () => {
    expect(isInspectorEvent({
      type: 'ftb:inspector:hover',
      protocolVersion: INSPECTOR_PROTOCOL_VERSION,
      target: evidence({ candidateSelectors: ['#anything'] }),
    })).toBe(false)
    expect(isInspectorEvent({
      type: 'ftb:inspector:hover',
      protocolVersion: INSPECTOR_PROTOCOL_VERSION,
      target: evidence({ candidateSelectors: ['.fi-btn:active'] }),
    })).toBe(false)
    expect(isInspectorEvent({
      type: 'ftb:inspector:select',
      protocolVersion: INSPECTOR_PROTOCOL_VERSION,
      target: evidence({ semanticBreadcrumb: '<script>alert(1)</script>' }),
    })).toBe(false)
    expect(isInspectorEvent({ type: 'ftb:inspector:clear', protocolVersion: INSPECTOR_PROTOCOL_VERSION })).toBe(true)
  })

  it('requires the selected selector to be one of the reported candidates', () => {
    expect(isInspectorEvent({
      type: 'ftb:inspector:select',
      protocolVersion: INSPECTOR_PROTOCOL_VERSION,
      target: evidence({ targetSelector: '.fi-section' }),
    })).toBe(false)
  })

  it('resolves a mapped selector to its editable registry controls', () => {
    expect(resolveInspectorTarget(registry, evidence())).toMatchObject({
      status: 'editable',
      entry: { id: 'form.product-name' },
      editorTarget: 'form.product-name',
    })
  })

  it('resolves a selected child through a registered compound selector ending at that child', () => {
    expect(resolveInspectorTarget(registry, evidence({
      targetSelector: '.fi-input',
      candidateSelectors: [
        '.fi-input',
        '.fi-input-wrp-content-ctn .fi-input',
        '.fi-fo-text-input .fi-input',
        '.fi-fo-text-input .fi-input-wrp-content-ctn .fi-input',
        '.fi-input-wrp-content-ctn',
        '.fi-fo-text-input',
      ],
      classNames: ['fi-input', 'fi-fo-text-input'],
    })).status).toBe('editable')
  })

  it('does not map a global-search input to product name from the target class alone', () => {
    const result = resolveInspectorTarget(registry, evidence({
      targetSelector: '.fi-input.fi-input-has-inline-prefix',
      candidateSelectors: ['.fi-input', '.fi-global-search .fi-input', '.fi-input-wrp-content-ctn .fi-input'],
      classNames: ['fi-input', 'fi-global-search', 'fi-input-wrp-content-ctn'],
    }))

    expect(result).not.toHaveProperty('editorTarget')
    expect(result).not.toMatchObject({ entry: { id: 'form.product-name' } })
  })

  it('resolves selector-only matches without inventing an editor destination', () => {
    expect(resolveInspectorTarget(registry, evidence({ candidateSelectors: ['.fi-section'], classNames: ['fi-section'] }))).toMatchObject({
      status: 'selector-only',
      entry: { id: 'form.section' },
    })
    expect(resolveInspectorTarget(registry, evidence({ candidateSelectors: ['.fi-section'], classNames: ['fi-section'] }))).not.toHaveProperty('editorTarget')
  })

  it('does not fall back to an ancestor semantic selector when the selected child is unmapped', () => {
    expect(resolveInspectorTarget(registry, evidence({
      targetSelector: '.fi-unmapped-child',
      candidateSelectors: ['.fi-unmapped-child', '.fi-section'],
      classNames: ['fi-unmapped-child', 'fi-section'],
    })).status).toBe('no-match')
  })

  it('preserves explicit semantic breadcrumbs for selector-only matches', () => {
    expect(resolveInspectorTarget(registry, evidence({
      candidateSelectors: ['.fi-section'],
      classNames: ['fi-section'],
      semanticBreadcrumb: 'Forms / Product / Name',
    }))).toMatchObject({
      breadcrumb: 'Forms / Product / Name',
    })
  })

  it('uses the canonical registry label for mapped controls', () => {
    expect(resolveInspectorTarget(registry, evidence({ semanticBreadcrumb: 'fi-input' }))).toMatchObject({
      status: 'editable',
      breadcrumb: 'Product name input',
    })
  })
})
