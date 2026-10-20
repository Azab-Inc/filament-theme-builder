import type { TailwindColor, TailwindPaletteMetadata } from '@/models/tailwind-palette.model'
import { resolveTrustedColorReference } from '@/registry/tailwind-color-catalog'
import { TAILWIND_PALETTE_FAMILIES, TAILWIND_PALETTE_HEX, TAILWIND_PALETTE_SHADES } from '@/registry/tailwind-palette-snapshot'
import { isValidTailwindSnapshot } from '@/utils/tailwind-palette-validation'

const families = [...TAILWIND_PALETTE_FAMILIES]
const colors = families.flatMap((family) => TAILWIND_PALETTE_SHADES.map((shade, index) => {
  const sourceValue = resolveTrustedColorReference(`var(--color-${family}-${shade})`)
  return {
    family, shade, name: `${family}-${shade}`, sourceValue: sourceValue ?? '',
    value: TAILWIND_PALETTE_HEX[family]?.[index] ?? '',
  }
}))
const valid = isValidTailwindSnapshot(colors, families)
const snapshot: readonly TailwindColor[] = Object.freeze(valid ? colors.map((color) => Object.freeze(color)) : [])

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
