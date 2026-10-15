import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'

export type InspectorEvent =
  | { type: 'ftb:inspector:ready'; protocolVersion: 1 }
  | { type: 'ftb:inspector:hover' | 'ftb:inspector:select'; protocolVersion: 1; target: InspectorTargetEvidence }
  | { type: 'ftb:inspector:clear'; protocolVersion: 1 }
