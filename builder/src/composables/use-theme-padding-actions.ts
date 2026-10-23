import type { ThemeStoreContext } from '@/models/theme-store.model'
import type { PaddingMutation, PaddingReadRequest, PaddingResolutionRequest } from '@/models/padding.model'
import { readPadding, resolvePadding } from '@/utils/theme-resolver'
import { validatePaddingMutation } from '@/utils/padding-validation'
import { paddingRecordContext, samePaddingContext } from '@/utils/padding-identity'

export function useThemePaddingActions({ theme, registry }: ThemeStoreContext) {
  function setPadding(mutation: PaddingMutation & { operation: 'set' }): void {
    if (!validatePaddingMutation(mutation, theme.value, registry).valid) return
    const existing = theme.value.padding.find((record) => samePaddingContext(paddingRecordContext(record), mutation.context))
    const next = theme.value.padding.filter((record) => !samePaddingContext(paddingRecordContext(record), mutation.context))
    const edges = { ...(existing?.edges ?? {}), ...mutation.edges }
    next.push({ ...mutation.context, edges })
    theme.value = { ...theme.value, padding: next }
  }

  function resetPadding(mutation: PaddingMutation & { operation: 'reset' }): void {
    if (!validatePaddingMutation(mutation, theme.value, registry).valid) return
    const next = theme.value.padding.flatMap((record) => {
      if (!samePaddingContext(paddingRecordContext(record), mutation.context)) return [record]
      const edges = { ...record.edges }
      mutation.resetEdges!.forEach((edge) => delete edges[edge])
      return Object.keys(edges).length ? [{ ...record, edges }] : []
    })
    if (JSON.stringify(next) !== JSON.stringify(theme.value.padding)) theme.value = { ...theme.value, padding: next }
  }

  return {
    setPadding,
    resetPadding,
    readPadding: (request: PaddingReadRequest) => readPadding(theme.value, registry, request),
    resolvePadding: (request: PaddingResolutionRequest) => resolvePadding(theme.value, registry, request),
  }
}
