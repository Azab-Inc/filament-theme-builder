import type { ResolveRequest } from '@/models/theme.model'
import type { SemanticComponentScope } from '@/models/semantic-component-scope.model'

export type SemanticComponentRow = SemanticComponentScope & {
  request: ResolveRequest
  value: string
  source: string
  explicit: boolean
}
