import type { ModeLinkMap } from '@/models/theme-mode-link.model'
import type { UserTokens } from '@/models/user-tokens.model'
import { hasUserTokenReference } from '@/utils/user-token-validation'
import { validModeLinkTarget } from '@/utils/mode-link-target-validation'
import { modeLinkTargetIdentity, type ModeLinkTarget } from '@/models/mode-link-target.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { KNOWN_EXPLICIT_PATHS } from '@/utils/foundation-validation-constants.util'
import { readStoredModeLinkValue, legacyModeLinkTarget } from '@/utils/mode-link-stored-values'
import type { ThemeStateCurrent } from '@/models/theme.model'

const identityPattern = /^(?:foundation\.(?:surfaces|borders|text)\.[a-z-]+|user\.color\.[a-z][a-z0-9-]{0,31}|palette\.(?:primary|success|warning|danger|info|gray)\.(?:base|shade\.(?:50|100|200|300|400|500|600|700|800|900|950))|raw\|[^|]{1,160}\|[a-z-]+|semantic\|[a-z0-9.-]{1,120})$/

export function validateModeLinks(value: unknown, tokens: UserTokens | undefined, state?: ThemeStateCurrent): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Mode links must be an object.'
  const seen = new Set<string>()
  for (const [key, link] of Object.entries(value)) {
    if (key.length > 2048 || !link || typeof link !== 'object' || Array.isArray(link)) return `Invalid mode-link identity: ${key}`
    const record = link as Record<string, unknown>
    if (Object.keys(record).some((name) => !['identity', 'value', 'linked', 'target'].includes(name)) || record.identity !== key || record.linked !== true || !['string', 'number', 'boolean'].includes(typeof record.value)) return `Invalid mode-link metadata: ${key}`
    if (record.target !== undefined) {
      if (!validModeLinkTarget(record.target as ModeLinkTarget, createThemeRegistry())) return `Invalid mode-link target: ${key}`
      const target = record.target as ModeLinkTarget
      const canonical = modeLinkTargetIdentity(target)
      const legacy = target.kind !== 'foundation' && target.kind !== 'user-color' ? `target:${JSON.stringify(target)}` : canonical
      if (key !== canonical && key !== legacy) return `Invalid mode-link target: ${key}`
      if (seen.has(canonical)) return `Duplicate mode-link target: ${canonical}`
      seen.add(canonical)
      if ((target.kind === 'user-palette-base' || target.kind === 'user-palette-shade') && (!tokens || !Object.prototype.hasOwnProperty.call(tokens.palettes, target.name))) return `Unknown user palette link: ${key}`
    } else if (!identityPattern.test(key)) return `Invalid mode-link identity: ${key}`
    if (key.startsWith('foundation.') && !KNOWN_EXPLICIT_PATHS.has(`${key.slice('foundation.'.length)}.light`)) return `Unknown foundation link: ${key}`
    if (key.startsWith('user.color.')) {
      const reference = `user.color.${key.slice('user.color.'.length)}`
      if (!tokens || !hasUserTokenReference(tokens, reference)) return `Unknown user token link: ${key}`
    }
    if (state) {
      const target = record.target as ModeLinkTarget | undefined ?? legacyModeLinkTarget(key)
      if (!target || readStoredModeLinkValue(state, target, 'light') !== record.value || readStoredModeLinkValue(state, target, 'dark') !== record.value) return `Linked values must match their stored shared value: ${key}`
    }
  }
  return null
}

export function isModeLinkMap(value: unknown, tokens?: UserTokens): value is ModeLinkMap { return validateModeLinks(value, tokens) === null }
