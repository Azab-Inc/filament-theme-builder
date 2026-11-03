import type { ModeLinkMap } from '@/models/theme-mode-link.model'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'

/** Preserve saved links while upgrading their previously order-dependent identities. */
export function normalizeModeLinkIdentities(links: ModeLinkMap): ModeLinkMap {
  return Object.fromEntries(Object.entries(links).map(([key, link]) => {
    const identity = link.target ? modeLinkTargetIdentity(link.target) : key
    return [identity, { ...link, identity }]
  }))
}
