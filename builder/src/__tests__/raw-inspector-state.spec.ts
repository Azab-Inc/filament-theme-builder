import { describe, expect, it } from 'vitest'
import { inspectorStateForSelector, selectorForInspectorState } from '@/utils/raw-inspector-state'
import { validateRawSelector } from '@/utils/raw-override-validation'

describe('raw Inspector visual states', () => {
  it('targets sidebar label states at the link button and active ancestor', () => {
    expect(selectorForInspectorState('.fi-sidebar-item-label', 'hover')).toBe('.fi-sidebar-item-btn:hover .fi-sidebar-item-label')
    expect(selectorForInspectorState('.fi-sidebar-item-label', 'focus')).toBe('.fi-sidebar-item-btn:focus .fi-sidebar-item-label')
    expect(selectorForInspectorState('.fi-sidebar-item-label', 'selected')).toBe('.fi-sidebar-item.fi-active .fi-sidebar-item-label')
    expect(validateRawSelector('.fi-sidebar-item-btn:focus .fi-sidebar-item-label').valid).toBe(true)
  })

  it('switches back to stable base without adding duplicate state suffixes', () => {
    expect(selectorForInspectorState('.fi-btn:hover', 'focus')).toBe('.fi-btn:focus')
    expect(selectorForInspectorState('.fi-btn:focus', 'hover')).toBe('.fi-btn:hover')
    expect(selectorForInspectorState('.fi-sidebar-item.fi-active .fi-sidebar-item-label', 'default')).toBe('.fi-sidebar-item-label')
    expect(inspectorStateForSelector('.fi-btn:focus')).toBe('focus')
  })

  it('does not invent selected state for unrelated or unsafe selector evidence', () => {
    expect(selectorForInspectorState('.fi-btn', 'selected')).toBeNull()
    expect(selectorForInspectorState('.custom-button', 'hover')).toBeNull()
    expect(selectorForInspectorState('.fi-btn, .fi-input', 'focus')).toBeNull()
  })
})
