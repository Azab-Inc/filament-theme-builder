import type { ComputedRef, Ref } from 'vue'

import type { EditorSection } from '@/models/editor.model'
import type { InspectorRawSelectorProposal } from '@/models/inspector-raw-selector-proposal.model'
import type { InspectorResolution } from '@/models/inspector-resolution.model'
import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'

export type InspectorMessageHandlerOptions = {
  inspectorRegistry: FilamentRegistry
  inspectorEnabled: Ref<boolean>
  inspectorResolution: Ref<InspectorResolution | null>
  selectedInspectorEvidence: Ref<InspectorTargetEvidence | null>
  selectedEditorSection: Ref<EditorSection>
  rawSelector: Ref<string>
  rawSelectorError: Ref<string | undefined>
  rawSelectorProposal: ComputedRef<InspectorRawSelectorProposal>
}
