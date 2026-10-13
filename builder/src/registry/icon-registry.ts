import type { IconPackConfiguration, IconPackName, ResourceIconKey } from '@/models/icons.model'
import { ICON_PACK_NAMES, RESOURCE_ICON_KEYS } from '@/models/icons.model'

export { ICON_PACK_NAMES, RESOURCE_ICON_KEYS }

export const ICON_PACK_PRESETS: Readonly<Record<IconPackName, Readonly<Record<ResourceIconKey, string>>>> = {
  default: {
    products: 'heroicon-o-shopping-bag',
    orders: 'heroicon-o-shopping-cart',
    customers: 'heroicon-o-users',
    inventory: 'heroicon-o-archive-box',
  },
  solid: {
    products: 'heroicon-s-shopping-bag',
    orders: 'heroicon-s-shopping-cart',
    customers: 'heroicon-s-users',
    inventory: 'heroicon-s-archive-box',
  },
  mini: {
    products: 'heroicon-m-shopping-bag',
    orders: 'heroicon-m-shopping-cart',
    customers: 'heroicon-m-users',
    inventory: 'heroicon-m-archive-box',
  },
}

const HEROICON_BASE_NAMES = ['shopping-bag', 'shopping-cart', 'users', 'archive-box', 'cube', 'star', 'bolt', 'heart', 'check-circle'] as const
const HEROICON_IDENTIFIER = new RegExp(`^heroicon-(?:o|s|m)-(?:${HEROICON_BASE_NAMES.join('|')})$`)

export function createDefaultIconConfiguration(): IconPackConfiguration {
  return { pack: 'default', overrides: {} }
}

export function resolveResourceIcon(configuration: IconPackConfiguration, key: ResourceIconKey): string {
  return configuration.overrides[key] ?? ICON_PACK_PRESETS[configuration.pack][key]
}

export function validateIconConfiguration(value: unknown): { valid: true; configuration: IconPackConfiguration } | { valid: false; error: string } {
  if (!isRecord(value) || !ICON_PACK_NAMES.includes(value.pack as IconPackName) || !isRecord(value.overrides)) {
    return { valid: false, error: 'Invalid icon pack configuration' }
  }

  const overrides: Record<string, string> = {}
  for (const [key, icon] of Object.entries(value.overrides)) {
    if (!RESOURCE_ICON_KEYS.includes(key as ResourceIconKey)) return { valid: false, error: `Unknown semantic icon: ${key}` }
    if (typeof icon !== 'string' || !HEROICON_IDENTIFIER.test(icon)) return { valid: false, error: `Unknown Heroicon identifier: ${String(icon)}` }
    overrides[key] = icon
  }

  return { valid: true, configuration: { pack: value.pack as IconPackName, overrides } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
