import {
  TAILWIND_COLOR_FAMILIES,
  TAILWIND_COLOR_SHADES,
  resolveTrustedColorReference,
} from '@/registry/tailwind-color-catalog'

export const COLOR_CHOICE_PROTOTYPE_COLORS = TAILWIND_COLOR_FAMILIES.flatMap((family) =>
  TAILWIND_COLOR_SHADES.map((shade) => ({
    family,
    shade,
    token: `${family}-${shade}`,
    value: resolveTrustedColorReference(`var(--color-${family}-${shade})`) ?? '',
  })),
)

export function isColorChoicePrototypeDraft(value: string): boolean {
  return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) || /^var\(--[\w-]+\)$/.test(value)
}

export function colorChoicePrototypeHex(value: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) return value
  context.fillStyle = '#000000'
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  return `#${[...context.getImageData(0, 0, 1, 1).data]
    .slice(0, 3)
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('')}`
}

export function colorChoicePrototypeSwatch(
  value: string,
  resolve: (value: string) => string,
): string {
  return value.startsWith('var(') ? resolve(value) : value
}
