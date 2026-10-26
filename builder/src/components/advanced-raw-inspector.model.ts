import type { RawSelectorProposal, RawVisualProperty } from '@/models/raw-overrides.model'

export type AdvancedRawInspectorProps = {
  selector: string
  selectorError?: string
  selectorClassification: RawSelectorProposal
  properties: ReadonlyArray<RawVisualProperty>
  propertyValue: (property: RawVisualProperty) => string
  visible: boolean
  activeThemeId?: string
  state?: import('@/utils/raw-inspector-state').InspectorVisualState
}
