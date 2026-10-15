import type { ThemeStateV4 } from '@/models/theme.model'

export type ThemeDeserializeResult =
  | { valid: true; state: ThemeStateV4 }
  | { valid: false; error: string }
