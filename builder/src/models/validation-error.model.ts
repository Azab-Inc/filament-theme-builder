import type { FoundationValidationResult } from '@/models/foundations.model'

export type ValidationError = Exclude<FoundationValidationResult, { valid: true }>
