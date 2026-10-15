import type { IconPackConfiguration, IconPackName, ResourceIconKey } from '../models/icons.model'

export type IconPackConfigurationPanelProps = {
  active: boolean
  configuration: IconPackConfiguration
  packNames: readonly IconPackName[]
  resourceKeys: readonly ResourceIconKey[]
  iconOptions: readonly string[]
  previews: Record<ResourceIconKey, string>
}
