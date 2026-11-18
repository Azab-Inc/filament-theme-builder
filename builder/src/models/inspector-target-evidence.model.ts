export type InspectorTargetEvidence = {
  candidateSelectors: string[]
  classNames: string[]
  targetId?: string
  targetSelector?: string | null
  semanticBreadcrumb?: string
  componentId?: string
  variantId?: string
  stateId?: string
  targetScope?: import('@/models/inspector-target-scope.model').InspectorTargetScope
  surfaces?: Array<{ label: string; selector: string }>
}
