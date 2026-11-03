import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeRelayIntent } from '@/models/theme-relay-intent.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { applyThemeRelayIntent } from '@/utils/theme-relay-intent'

export function useThemeRelayIntentApplication(context: ThemeStoreContext, registry: FilamentRegistry) {
  const applyRelayIntent = (intent: ThemeRelayIntent): { ok: true } | { ok: false; error: string } => {
    try {
      const before = JSON.stringify(context.theme.value)
      context.commit?.(applyThemeRelayIntent(JSON.parse(before) as typeof context.theme.value, intent, registry))
      return JSON.stringify(context.theme.value) === before ? { ok: false, error: 'unchanged' } : { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'invalid_intent' }
    }
  }

  return { applyRelayIntent }
}
