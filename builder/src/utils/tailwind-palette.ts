import type { TailwindColor, TailwindPaletteMetadata } from '@/models/tailwind-palette.model'
import { TAILWIND_COLOR_FAMILIES, TAILWIND_COLOR_SHADES, resolveTrustedColorReference } from '@/registry/tailwind-color-catalog'
import { isValidTailwindSnapshot } from '@/utils/tailwind-palette-validation'

const shadeSequence = [...TAILWIND_COLOR_SHADES]
const families = [...TAILWIND_COLOR_FAMILIES]
const sourceSnapshot = families.flatMap((family) => shadeSequence.map((shade) => {
  const sourceValue = resolveTrustedColorReference(`var(--color-${family}-${shade})`)
  return { family, shade, name: `${family}-${shade}`, sourceValue }
}))
const convertedSnapshot = sourceSnapshot.map(({ family, shade, name, sourceValue }) => ({
  family, shade, name, sourceValue: sourceValue ?? '', value: sourceValue ? convertOklchToHex(sourceValue) : '',
}))
const valid = isValidTailwindSnapshot(convertedSnapshot, families)
const snapshot: readonly TailwindColor[] = Object.freeze(valid ? convertedSnapshot.map((color) => Object.freeze(color)) : [])

export const tailwindPaletteMetadata: TailwindPaletteMetadata = Object.freeze({
  sourceUrl: 'https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/theme.css',
  version: '4.3.3', snapshotDate: '2026-10-20', license: 'MIT',
  licenseNotice: 'MIT License\n\nCopyright (c) Tailwind Labs, Inc.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.',
  transformation: 'OKLCH to OKLab to linear sRGB to sRGB transfer; clamp channels to [0,1] then round to nearest 8-bit channel.',
})

export function getTailwindColors(): readonly TailwindColor[] { return snapshot }
export function searchTailwindColors(query: string): readonly TailwindColor[] {
  if (!valid || typeof query !== 'string') return EMPTY
  const needle = query.trim().toLowerCase()
  return needle ? snapshot.filter((color) => `${color.family} ${color.shade} ${color.name}`.toLowerCase().includes(needle)) : snapshot
}
export function findTailwindColor(value: string): TailwindColor | undefined {
  return valid && typeof value === 'string' ? snapshot.find((color) => color.value.toLowerCase() === value.trim().toLowerCase() || color.name.toLowerCase() === value.trim().toLowerCase()) : undefined
}

const EMPTY: readonly TailwindColor[] = Object.freeze([])

function convertOklchToHex(input: string): string {
  const match = /^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+|none)\)$/.exec(input)
  if (!match) return ''
  const l = Number(match[1]) / 100, c = Number(match[2]), h = match[3] === 'none' ? 0 : Number(match[3])
  const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180)
  const l1 = l + 0.3963377774 * a + 0.2158037573 * b, m1 = l - 0.1055613458 * a - 0.0638541728 * b, s1 = l - 0.0894841775 * a - 1.291485548 * b
  const L = l1 ** 3, M = m1 ** 3, S = s1 ** 3
  const linear = [4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S, -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S, -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S]
  return `#${linear.map((channel) => Math.round(Math.max(0, Math.min(1, channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055)) * 255).toString(16).padStart(2, '0')).join('')}`
}
