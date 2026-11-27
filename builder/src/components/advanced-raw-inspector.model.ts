import type { FoundationFontChoiceOption } from '@/models/foundation-font-choice-option.model'
import type { RawSelectorProposal, RawVisualProperty } from '@/models/raw-overrides.model'

export type AdvancedRawInspectorProps = {
  selector: string
  selectorError?: string
  selectorClassification: RawSelectorProposal
  properties: ReadonlyArray<RawVisualProperty>
  propertyValue: (property: RawVisualProperty) => string
  visible: boolean
  activeThemeId?: string
  fontChoices?: ReadonlyArray<FoundationFontChoiceOption>
  state?: import('@/utils/raw-inspector-state').InspectorVisualState
  uniqueElementId?: string
  uniqueElementIdError?: string
  uniqueElementIdAvailable?: boolean
  uniqueElementIdEnabled?: boolean
}
