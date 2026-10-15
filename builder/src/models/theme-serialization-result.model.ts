import type { ThemeStateV2 } from '@/models/theme.model'
import type { ThemeSerializationMode } from '@/models/theme-serialization-mode.model'

export type ThemeSerializationResult =
  | { valid: true; mode: ThemeSerializationMode; state: ThemeStateV2 }
  | { valid: false; mode: ThemeSerializationMode; error: string }
