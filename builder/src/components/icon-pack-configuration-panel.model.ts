import type { IconPackConfiguration, IconPackName, ResourceIconKey } from '../models/icons.model'

export type IconOverrideChange = { key: ResourceIconKey; value: string }

export type IconPackConfigurationPanelProps = {
  active: boolean
  configuration: IconPackConfiguration
  packNames: readonly IconPackName[]
  resourceKeys: readonly ResourceIconKey[]
  iconOptions: readonly string[]
  previews: Record<ResourceIconKey, string>
}

export type IconPackConfigurationPanelEmits = {
  (event: 'changePack', pack: IconPackName): void
  (event: 'changeOverride', change: IconOverrideChange): void
  (event: 'resetOverride', key: ResourceIconKey): void
  (event: 'resetConfiguration'): void
}
