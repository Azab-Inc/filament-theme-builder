export const ICON_PACK_NAMES = ['default', 'solid', 'mini'] as const
export type IconPackName = typeof ICON_PACK_NAMES[number]

export const RESOURCE_ICON_KEYS = ['products', 'orders', 'customers', 'inventory'] as const
export type ResourceIconKey = typeof RESOURCE_ICON_KEYS[number]

export type SemanticResourceIconOverrides = Partial<Record<ResourceIconKey, string>>

export type IconPackConfiguration = {
  pack: IconPackName
  overrides: SemanticResourceIconOverrides
}
