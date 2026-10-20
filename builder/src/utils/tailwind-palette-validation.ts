import type { TailwindColor } from '@/models/tailwind-palette.model'

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const HEX = /^#[\da-f]{6}$/
const OKLCH = /^oklch\([\d.]+%\s+[\d.]+\s+(?:[\d.]+|none)\)$/

export function isValidTailwindSnapshot(colors: readonly TailwindColor[], families: readonly string[]): boolean {
  if (families.length !== 26 || colors.length !== 286) return false
  const names = new Set<string>()
  for (const [index, color] of colors.entries()) {
    if (!color || !families.includes(color.family) || !SHADES.includes(color.shade) || color.name !== `${color.family}-${color.shade}`) return false
    if (!HEX.test(color.value) || !OKLCH.test(color.sourceValue) || names.has(color.name)) return false
    if (color.family !== families[Math.floor(index / SHADES.length)] || color.shade !== SHADES[index % SHADES.length]) return false
    names.add(color.name)
  }
  return names.size === 286
}
