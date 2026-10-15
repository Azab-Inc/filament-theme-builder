import type { RegistryEntry } from '@/models/theme-registry.model'
import { showcaseEntry } from '@/registry/theme-registry-catalog-showcases-entry'

export const navigationShowcaseEntries: readonly RegistryEntry[] = [
  showcaseEntry(
    'navigation.global-search',
    'Global search surface',
    'navigation',
    ['.fi-global-search'],
    [],
    ['default', 'open'],
  ),
  showcaseEntry(
    'navigation.login',
    'Login surface',
    'navigation',
    ['.fi-simple-page'],
    [],
    ['default', 'validation'],
  ),
  showcaseEntry(
    'navigation.profile-menu',
    'Profile menu surface',
    'navigation',
    ['.fi-user-menu'],
    [],
    ['default', 'open'],
  ),
  showcaseEntry(
    'navigation.sidebar',
    'Sidebar navigation',
    'navigation',
    ['.fi-sidebar'],
    [],
    ['default', 'collapsed'],
  ),
  showcaseEntry(
    'navigation.sidebar-badge',
    'Sidebar navigation badge',
    'navigation',
    ['.fi-sidebar-item-badge-ctn'],
    [],
    ['default'],
  ),
  showcaseEntry(
    'navigation.tenant-switcher',
    'Controlled tenant switcher',
    'navigation',
    ['.fi-ftb-tenant-switcher'],
    [],
    ['default', 'presentation-only'],
  ),
  showcaseEntry(
    'navigation.topbar',
    'Topbar navigation',
    'navigation',
    ['.fi-topbar'],
    [],
    ['default'],
  ),
]
