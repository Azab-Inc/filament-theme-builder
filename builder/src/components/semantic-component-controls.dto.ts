import type { SemanticComponentRow } from './semantic-component-controls.model'

export type SemanticComponentValueChange = {
  row: SemanticComponentRow
  event: Event
}

export type SemanticComponentReset = {
  row: SemanticComponentRow
}
