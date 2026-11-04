import type { UserTokens } from '@/models/user-tokens.model'
import { hasUserTokenReference, parseUserTokenReference } from '@/utils/user-token-validation'

export function userTokenCssValue(value: string, tokens: UserTokens | undefined): string | null {
  if (!value.startsWith('user.')) return value
  if (!tokens || !parseUserTokenReference(value) || !hasUserTokenReference(tokens, value)) return null
  const [, kind, name, shade] = value.split('.')
  return `var(--ftb-user-${kind}-${name}${shade ? `-${shade}` : ''})`
}
