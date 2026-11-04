import type { ThemeStateCurrent } from '@/models/theme.model'

export type ThemeDeserializeResult =
  | { valid: true; state: ThemeStateCurrent }
  | { valid: false; error: string }
