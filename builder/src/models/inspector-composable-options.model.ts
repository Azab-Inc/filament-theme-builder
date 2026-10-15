import type { ComputedRef, Ref } from 'vue'

import type { EditorSection } from '@/models/editor.model'
import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'
import type { InspectorRawSelectorProposal } from '@/models/inspector-raw-selector-proposal.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'

export type UseInspectorOptions = {
  iframe: Ref<HTMLIFrameElement | undefined>
  previewUrl: string
  inspectorRegistry: FilamentRegistry
  selectedEditorSection: Ref<EditorSection>
  rawSelector: Ref<string>
  rawSelectorError: Ref<string | undefined>
  rawSelectorProposal: ComputedRef<InspectorRawSelectorProposal>
  selectedInspectorEvidence?: Ref<InspectorTargetEvidence | null>
}
