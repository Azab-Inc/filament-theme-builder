import { describe, expect, it } from 'vitest'

import { digestBytes, decodeThemeBytes } from '@/utils/theme-import-bytes'

describe('theme import bytes', () => {
  it('decodes valid UTF-8 without replacement characters', () => {
    expect(decodeThemeBytes(new TextEncoder().encode('{"name":"café"}'))).toBe('{"name":"café"}')
  })

  it('rejects malformed UTF-8', () => {
    expect(() => decodeThemeBytes(new Uint8Array([0xc3, 0x28]))).toThrow(/encoding/i)
  })

  it('returns SHA-256 in lowercase hexadecimal', async () => {
    expect(await digestBytes(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
