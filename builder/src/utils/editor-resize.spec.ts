import { describe, expect, it } from 'vitest'
import { clampEditorWidth, resizeEditorWidth } from './editor-resize'

describe('editor resize bounds', () => {
  it('clamps the editor to both pane minimums', () => {
    expect(clampEditorWidth(100, 1000, 320, 320)).toBe(320)
    expect(clampEditorWidth(900, 1000, 320, 320)).toBe(680)
  })

  it('applies pointer movement without changing the available width', () => {
    expect(resizeEditorWidth(420, 150, 1000, 320, 320)).toBe(570)
    expect(resizeEditorWidth(420, -200, 1000, 320, 320)).toBe(320)
  })
})
