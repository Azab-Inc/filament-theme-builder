import type { ThemeStoreContext } from '@/models/theme-store.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { ModeLinkMap } from '@/models/theme-mode-link.model'
import type { UniqueElementIdAssignment } from '@/models/unique-element-id-assignment.model'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { generateUniqueElementId, validateUniqueElementId } from '@/utils/unique-element-id-validation'

export function useThemeUniqueElementActions({ theme, commit = (candidate) => { theme.value = candidate } }: ThemeStoreContext) {
  function isAssignmentRule(selector: string, id: string): boolean {
    return selector === `#${id}` || selector === `#${id}:hover` || selector === `#${id}:focus`
  }
  function migrateRawModeLinks(sourceId: string, replacementSelector: (selector: string) => string): typeof theme.value.modeLinks {
    const next: ModeLinkMap = {}
    for (const link of Object.values(theme.value.modeLinks ?? {})) {
      const target: ModeLinkTarget | undefined = link.target
      if (!target || target.kind !== 'raw' || !isAssignmentRule(target.selector, sourceId)) {
        next[link.identity] = link
        continue
      }
      const migratedTarget: ModeLinkTarget = { ...target, selector: replacementSelector(target.selector) }
      const identity: string = modeLinkTargetIdentity(migratedTarget)
      next[identity] = { ...link, identity, target: migratedTarget }
    }
    return next
  }
  function enableUniqueElementId(sourceSelector: string, matchIndex: number): string {
    const assignments: UniqueElementIdAssignment[] = theme.value.uniqueElementIds ?? []
    const existing: UniqueElementIdAssignment | undefined = assignments.find((item) => item.sourceSelector === sourceSelector && item.matchIndex === matchIndex)
    if (existing) return existing.id
    const id: string = generateUniqueElementId(sourceSelector, matchIndex, new Set(assignments.map((item) => item.id)))
    commit({ ...cloneTheme(theme.value), uniqueElementIds: [...assignments, { id, sourceSelector, matchIndex }] })
    return id
  }
  function renameUniqueElementId(sourceSelector: string, matchIndex: number, id: string): string | null {
    const error: string | null = validateUniqueElementId(id)
    const assignments: UniqueElementIdAssignment[] = theme.value.uniqueElementIds ?? []
    if (error || assignments.some((item) => item.id === id && !(item.sourceSelector === sourceSelector && item.matchIndex === matchIndex))) return error ?? 'This ID is already assigned.'
    const current: UniqueElementIdAssignment | undefined = assignments.find((item) => item.sourceSelector === sourceSelector && item.matchIndex === matchIndex)
    if (!current) return 'Unique element target is not enabled.'
    const next: UniqueElementIdAssignment[] = assignments.map((item) => item === current ? { ...item, id } : item)
    const rawOverrides: typeof theme.value.rawOverrides = theme.value.rawOverrides.map((item) => isAssignmentRule(item.selector, current.id) ? { ...item, selector: item.selector.replace(`#${current.id}`, `#${id}`) } : item)
    commit({ ...cloneTheme(theme.value), uniqueElementIds: next, rawOverrides, modeLinks: migrateRawModeLinks(current.id, (selector) => selector.replace(`#${current.id}`, `#${id}`)) })
    return null
  }
  function disableUniqueElementId(sourceSelector: string, matchIndex: number): void {
    const assignments: UniqueElementIdAssignment[] = theme.value.uniqueElementIds ?? []
    const current: UniqueElementIdAssignment | undefined = assignments.find((item) => item.sourceSelector === sourceSelector && item.matchIndex === matchIndex)
    if (!current) return
    commit({ ...cloneTheme(theme.value), uniqueElementIds: assignments.filter((item) => item !== current), rawOverrides: theme.value.rawOverrides.filter((item) => !isAssignmentRule(item.selector, current.id)), modeLinks: migrateRawModeLinks(current.id, (selector) => selector.replace(`#${current.id}`, current.sourceSelector)) })
  }
  return { enableUniqueElementId, renameUniqueElementId, disableUniqueElementId }
}
