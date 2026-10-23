import { toRaw } from 'vue'

import type { ThemeOverride, ThemeStateV2, ThemeStateV5, ResolveRequest } from '@/models/theme.model'
import type { ThemeMode } from '@/models/foundations.model'

export function cloneTheme(value: ThemeStateV5): ThemeStateV5 {
  return structuredClone(JSON.parse(JSON.stringify(toRaw(value))) as ThemeStateV5)
}

export function snapshot(value: ThemeStateV5): ThemeStateV5 {
  return cloneTheme(value)
}

export function sameTheme(left: ThemeStateV5, right: ThemeStateV5): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function toLegacyTheme(value: ThemeStateV5): ThemeStateV2 {
  return {
    schemaVersion: 2,
    colors: { primary: value.colors.primary },
    overrides: structuredClone(JSON.parse(JSON.stringify(toRaw(value.overrides)))),
  }
}

export function deepestScope(request: ResolveRequest): ThemeOverride['scope'] {
  if (request.stateId !== undefined) return 'state'
  if (request.variantId !== undefined) return 'variant'
  if (request.componentId !== undefined) return 'component'
  return 'global'
}

export function sameOverrideKey(left: ThemeOverride, right: ThemeOverride): boolean {
  return left.targetId === right.targetId && left.controlId === right.controlId && left.scope === right.scope
    && left.componentId === right.componentId && left.variantId === right.variantId && left.stateId === right.stateId
}

export function matchesRequest(override: ThemeOverride, request: ResolveRequest, scope: ThemeOverride['scope']): boolean {
  return override.targetId === request.targetId && override.controlId === request.controlId && override.scope === scope
    && override.componentId === request.componentId && override.variantId === request.variantId && override.stateId === request.stateId
}

export function getPath(root: Record<string, unknown>, path: string): unknown {
  return foundationPathSegments(path).reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, root)
}

export function setPath(root: Record<string, unknown>, path: string, value: unknown): boolean {
  const keys = foundationPathSegments(path)
  const leaf = keys.pop()
  if (!leaf) return false
  let target = root
  for (const key of keys) {
    if (!isRecord(target[key])) return false
    target = target[key]
  }
  target[leaf] = value
  return true
}

export function selectMode<T>(values: Record<string, { light: T; dark: T }>, mode: ThemeMode): Record<string, T> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value[mode]]))
}

export function foundationPathSegments(path: string): string[] {
  const keys = path.split('.')
  const exactKey = `${keys[1]}.${keys[2]}`
  return keys[0] === 'spacing' && keys.length === 3 && (exactKey === '0.5' || exactKey === '1.5')
    ? ['spacing', exactKey] : keys
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
