export const guidelineVariants = ['actions', 'navigation', 'tokens', 'keyboard', 'mobile'] as const
export type GuidelineVariant = (typeof guidelineVariants)[number]
export type GuidelineGroup = 'Colors' | 'Surfaces' | 'Typography' | 'Layout'
export const guidelineGroups = ['Colors', 'Surfaces', 'Typography', 'Layout'] as const
export const isGuidelineGroup = (value: string | null): value is GuidelineGroup => value !== null && guidelineGroups.includes(value as GuidelineGroup)

export const isGuidelineVariant = (value: string | null): value is GuidelineVariant =>
  value !== null && guidelineVariants.includes(value as GuidelineVariant)
