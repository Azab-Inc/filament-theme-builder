import type { IconPackName, ResourceIconKey } from '../models/icons.model'
import type { IconOverrideChange } from '../models/icon-override-change.model'

export type IconPackConfigurationPanelEmits = {
  (event: 'changePack', pack: IconPackName): void
  (event: 'changeOverride', change: IconOverrideChange): void
  (event: 'resetOverride', key: ResourceIconKey): void
  (event: 'resetConfiguration'): void
}
