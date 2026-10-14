import { describe, expect, it } from 'vitest'

import { createThemeRegistry, resolveInspectorTarget } from '@/registry/theme-registry'
import {
  INSPECTOR_PROTOCOL_VERSION,
  isInspectorCommand,
  isInspectorEvent,
  type InspectorTargetEvidence,
} from '@/services/inspector-protocol'

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
      type: 'ftb:inspector:select',
      protocolVersion: INSPECTOR_PROTOCOL_VERSION,
      target: evidence({ semanticBreadcrumb: '<script>alert(1)</script>' }),
    })).toBe(false)
    expect(isInspectorEvent({ type: 'ftb:inspector:clear', protocolVersion: INSPECTOR_PROTOCOL_VERSION })).toBe(true)
  })

  it('resolves a mapped selector to its editable registry controls', () => {
    expect(resolveInspectorTarget(registry, evidence())).toMatchObject({
      status: 'editable',
      entry: { id: 'form.product-name' },
      editorTarget: 'form.product-name',
    })
  })

  it('resolves selector-only matches without inventing an editor destination', () => {
    expect(resolveInspectorTarget(registry, evidence({ candidateSelectors: ['.fi-section'], classNames: ['fi-section'] }))).toMatchObject({
      status: 'selector-only',
      entry: { id: 'form.section' },
    })
    expect(resolveInspectorTarget(registry, evidence({ candidateSelectors: ['.fi-section'], classNames: ['fi-section'] }))).not.toHaveProperty('editorTarget')
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
