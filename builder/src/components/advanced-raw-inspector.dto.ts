import type { RawVisualProperty } from '@/models/raw-overrides.model'

export type RawSelectorChange = {
  event: Event
}

export type RawPropertyChange = {
  property: RawVisualProperty
  event: Event
}

export type RawPropertyReset = {
  property: RawVisualProperty
}
