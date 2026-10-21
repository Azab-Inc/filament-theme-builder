import type { SemanticComponentRow } from '@/models/semantic-component-row.model'

export type SemanticComponentControlsProps = {
  rows: ReadonlyArray<SemanticComponentRow>
  activeThemeId?: string
}
