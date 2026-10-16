import type {
  FoundationMapping,
  FoundationRuntimeProperty,
} from '@/models/foundations.model'

export type FoundationInventoryEntry = {
  readonly id: string
  readonly compatibility: 'filament-5.9'
  readonly mapping: FoundationMapping
  readonly property: FoundationRuntimeProperty
  readonly variable?: string
  readonly selectors: readonly string[]
  readonly evidence: {
    readonly source: string
    readonly baseline: string
    readonly needle: string
    readonly reason: string
  }
}
