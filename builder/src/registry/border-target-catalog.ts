import type { BorderProperty } from '@/models/border-edge.model'

export type BorderTargetMetadata = {
  targetId: string
  selectors: readonly string[]
  ringBacked: boolean
  fallback: Record<'top' | 'right' | 'bottom' | 'left', Record<BorderProperty, string>>
  darkFallback?: Record<'top' | 'right' | 'bottom' | 'left', Record<BorderProperty, string>>
  componentSelectors?: Readonly<Record<string, readonly string[]>>
  variantSelectors?: Readonly<Record<string, readonly string[]>>
  stateSelectors?: Readonly<Record<string, readonly string[]>>
}

const noBorder = { width: '0px', color: 'transparent', style: 'none' }
const ringBorder = (color: string) => ({ width: '1px', color, style: 'solid' })
const darkRingBorder = ringBorder('color-mix(in oklab, var(--gray-50) 5%, transparent)')

export const BORDER_TARGET_CATALOG: readonly BorderTargetMetadata[] = Object.freeze([
  { targetId: 'table.header', selectors: ['.fi-ta-header'], ringBacked: false, fallback: { top: noBorder, right: noBorder, bottom: ringBorder('var(--gray-200)'), left: noBorder } },
  { targetId: 'table.container', selectors: ['.fi-ta-ctn'], ringBacked: true, fallback: { top: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), right: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), bottom: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), left: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)') }, darkFallback: { top: darkRingBorder, right: darkRingBorder, bottom: darkRingBorder, left: darkRingBorder } },
  { targetId: 'form.product-name', selectors: ['.fi-input-wrp'], ringBacked: true, componentSelectors: { form: ['.fi-input-wrp'] }, stateSelectors: { hover: ['.fi-input-wrp:hover'], focus: ['.fi-input-wrp'] }, fallback: { top: ringBorder('color-mix(in oklab, var(--gray-950) 10%, transparent)'), right: ringBorder('color-mix(in oklab, var(--gray-950) 10%, transparent)'), bottom: ringBorder('color-mix(in oklab, var(--gray-950) 10%, transparent)'), left: ringBorder('color-mix(in oklab, var(--gray-950) 10%, transparent)') }, darkFallback: { top: ringBorder('color-mix(in oklab, var(--gray-50) 10%, transparent)'), right: ringBorder('color-mix(in oklab, var(--gray-50) 10%, transparent)'), bottom: ringBorder('color-mix(in oklab, var(--gray-50) 10%, transparent)'), left: ringBorder('color-mix(in oklab, var(--gray-50) 10%, transparent)') } },
  { targetId: 'surface.section', selectors: ['.fi-section'], ringBacked: true, fallback: { top: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), right: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), bottom: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), left: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)') }, darkFallback: { top: darkRingBorder, right: darkRingBorder, bottom: darkRingBorder, left: darkRingBorder } },
  { targetId: 'surface.card', selectors: ['.fi-ta-ctn'], ringBacked: true, fallback: { top: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), right: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), bottom: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)'), left: ringBorder('color-mix(in oklab, var(--gray-950) 5%, transparent)') }, darkFallback: { top: darkRingBorder, right: darkRingBorder, bottom: darkRingBorder, left: darkRingBorder } },
])

export function borderTargetMetadata(targetId: string): BorderTargetMetadata | undefined {
  return BORDER_TARGET_CATALOG.find((target) => target.targetId === targetId)
}
