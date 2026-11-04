import { describe, expect, it } from 'vitest'
import { resolveUserColorValue } from '@/utils/user-token-resolution'

describe('mode-aware user color resolution', () => {
  it('resolves a named color independently per mode', () => {
    const tokens = { palettes: {}, colors: { accent: { light: '#fff', dark: '#111' } } }
    expect(resolveUserColorValue(tokens, 'user.color.accent', 'light')).toBe('#fff')
    expect(resolveUserColorValue(tokens, 'user.color.accent', 'dark')).toBe('#111')
    expect(resolveUserColorValue(tokens, 'user.color.missing', 'light')).toBeNull()
  })
})
