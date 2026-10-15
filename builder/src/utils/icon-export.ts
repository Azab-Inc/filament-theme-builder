import type { IconPackConfiguration, ResourceIconKey } from '@/models/icons.model'
import { RESOURCE_ICON_KEYS } from '@/models/icons.model'
import { resolveResourceIcon } from '@/registry/icon-registry'

const resourceAliases: Record<ResourceIconKey, string> = {
  products: 'panels::resources.products.navigation-item',
  orders: 'panels::resources.orders.navigation-item',
  customers: 'panels::resources.customers.navigation-item',
  inventory: 'panels::resources.inventories.navigation-item',
}

export function exportIconConfigurationPhp(configuration: IconPackConfiguration): string {
  const lines = RESOURCE_ICON_KEYS.map((key) => `    '${resourceAliases[key]}' => '${resolveResourceIcon(configuration, key)}',`)
  return [
    '->icons([',
    ...lines,
    '])',
  ].join('\n')
}
