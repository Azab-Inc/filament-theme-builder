export type InspectorTargetEvidence = {
  candidateSelectors: string[]
  classNames: string[]
  targetSelector?: string | null
  semanticBreadcrumb?: string
  componentId?: string
  variantId?: string
  stateId?: string
}
