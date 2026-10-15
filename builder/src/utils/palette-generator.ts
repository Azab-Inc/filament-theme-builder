import type { PaletteShade } from '@/models/foundations.model'
import { PALETTE_SHADES } from '@/models/foundations.model'

type Rgba = [red: number, green: number, blue: number, alpha: number]
type Palette = Record<PaletteShade, string>
type PaletteOverrides = Partial<Record<PaletteShade, string>>

const HEX_COLOR = /^#(?:[\da-fA-F]{6}|[\da-fA-F]{8})$/

/**
 * Generate shades using linear interpolation in encoded sRGB channel space.
 * Shades 50–400 mix white toward the base; 500 is the base; 600–950 mix
 * the base toward black. Each RGB channel is rounded to the nearest integer
 * (Math.round); for eight-digit input, the alpha byte is retained unchanged.
 */
export function generatePalette(base: string): Palette {
  const color = parseHex(base)
  const includeAlpha = base.length === 9
  const shades = {} as Palette

  for (const shade of PALETTE_SHADES) {
    if (shade === 500) {
      shades[shade] = formatHex(color, includeAlpha)
      continue
    }

    const fraction = shade < 500 ? shade / 1000 : (shade - 500) / 500
    const target = shade < 500 ? 255 : 0
    const channels = color.slice(0, 3).map((channel) => Math.round(channel + (target - channel) * fraction))
    shades[shade] = formatHex([channels[0]!, channels[1]!, channels[2]!, color[3]], includeAlpha)
  }

  return shades
}

/** Return generated shades with sparse explicit values applied on top. */
export function applyPaletteOverrides(generated: Palette, overrides: PaletteOverrides): Palette {
  const result = { ...generated }

  for (const [key, value] of Object.entries(overrides)) {
    const shade = Number(key)
    if (!PALETTE_SHADES.includes(shade as PaletteShade)) {
      throw new RangeError(`Unsupported palette shade: ${key}`)
    }

    parseHex(value)
    result[shade as PaletteShade] = value.toLowerCase()
  }

  return result
}

/** Remove a single shade override and return its generated value. */
export function resetPaletteShade(
  generated: Palette,
  overrides: PaletteOverrides,
  shade: PaletteShade,
): { shades: Palette; overrides: PaletteOverrides } {
  const nextOverrides = { ...overrides }
  delete nextOverrides[shade]

  return {
    shades: applyPaletteOverrides(generated, nextOverrides),
    overrides: nextOverrides,
  }
}

function parseHex(value: string): Rgba {
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    throw new RangeError(`Expected a six- or eight-digit hex color, received: ${String(value)}`)
  }

  const hex = value.slice(1)
  const channels = hex.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) ?? []
  return [channels[0]!, channels[1]!, channels[2]!, channels[3] ?? 255]
}

function formatHex([red, green, blue, alpha]: Rgba, includeAlpha: boolean): string {
  const color = [red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')
  return `#${color}${includeAlpha ? alpha.toString(16).padStart(2, '0') : ''}`
}
