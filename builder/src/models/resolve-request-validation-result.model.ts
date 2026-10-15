import type { ResolveRequest } from '@/models/theme.model'

export type ResolveRequestValidationResult =
  | { valid: true; request: ResolveRequest }
  | { valid: false; targetId: string; controlId: string; error: string }
