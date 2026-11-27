import type { ThemeStoreContext } from '@/models/theme-store.model'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { generateUniqueElementId, validateUniqueElementId } from '@/utils/unique-element-id-validation'

export function useThemeUniqueElementActions({ theme, commit = (candidate) => { theme.value = candidate } }: ThemeStoreContext) {
  function enableUniqueElementId(sourceSelector: string, matchIndex: number): string {
    const assignments = theme.value.uniqueElementIds ?? []
    const existing = assignments.find((item) => item.sourceSelector === sourceSelector && item.matchIndex === matchIndex)
    if (existing) return existing.id
    const id = generateUniqueElementId(sourceSelector, matchIndex, new Set(assignments.map((item) => item.id)))
    commit({ ...cloneTheme(theme.value), uniqueElementIds: [...assignments, { id, sourceSelector, matchIndex }] })
    return id
  }
  function renameUniqueElementId(sourceSelector: string, matchIndex: number, id: string): string | null {
    const error = validateUniqueElementId(id)
    const assignments = theme.value.uniqueElementIds ?? []
    if (error || assignments.some((item) => item.id === id && !(item.sourceSelector === sourceSelector && item.matchIndex === matchIndex))) return error ?? 'This ID is already assigned.'
    const current = assignments.find((item) => item.sourceSelector === sourceSelector && item.matchIndex === matchIndex)
    if (!current) return 'Unique element target is not enabled.'
    const next = assignments.map((item) => item === current ? { ...item, id } : item)
    const rawOverrides = theme.value.rawOverrides.map((item) => item.selector === `#${current.id}` ? { ...item, selector: `#${id}` } : item)
    commit({ ...cloneTheme(theme.value), uniqueElementIds: next, rawOverrides })
    return null
  }
  function disableUniqueElementId(sourceSelector: string, matchIndex: number): void {
    const assignments = theme.value.uniqueElementIds ?? []
    const current = assignments.find((item) => item.sourceSelector === sourceSelector && item.matchIndex === matchIndex)
    if (!current) return
    commit({ ...cloneTheme(theme.value), uniqueElementIds: assignments.filter((item) => item !== current), rawOverrides: theme.value.rawOverrides.filter((item) => item.selector !== `#${current.id}`) })
  }
  return { enableUniqueElementId, renameUniqueElementId, disableUniqueElementId }
}
