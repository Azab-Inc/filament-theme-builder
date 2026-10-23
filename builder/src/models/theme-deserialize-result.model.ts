import type { ThemeStateV5 } from '@/models/theme.model'

export type ThemeDeserializeResult =
  | { valid: true; state: ThemeStateV5 }
  | { valid: false; error: string }
