import { INSPECTOR_COLUMN_LIMIT, type InspectorTargetScope } from '@/models/inspector-target-scope.model'

const surfaceKinds = new Set(['table-container', 'table-header', 'table-body', 'table-row', 'chart-surface', 'topbar-search-surface'])
const parts = new Set(['header', 'body', 'row'])

export function isInspectorTargetScope(value: unknown): value is InspectorTargetScope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const target = value as Record<string, unknown>
  if (typeof target.kind !== 'string') return false
  if (surfaceKinds.has(target.kind)) return Object.keys(target).length === 1
  if (target.kind !== 'table-column' || typeof target.columnIndex !== 'number' || !Number.isInteger(target.columnIndex) || target.columnIndex < 1 || target.columnIndex > INSPECTOR_COLUMN_LIMIT) return false
  return Array.isArray(target.parts) && target.parts.length > 0 && target.parts.length <= 3 && new Set(target.parts).size === target.parts.length && target.parts.every((part) => typeof part === 'string' && parts.has(part)) && Object.keys(target).every((key) => ['kind', 'columnIndex', 'parts'].includes(key))
}

export function inspectorColumnSelectors(scope: Extract<InspectorTargetScope, { kind: 'table-column' }>): string[] {
  if (!isInspectorTargetScope(scope)) throw new Error('Invalid Inspector column scope')
  const index = scope.columnIndex
  return scope.parts.flatMap((part) => part === 'header' ? [`.fi-ta .fi-ta-header-cell:nth-child(${index})`] : part === 'body' ? [`.fi-ta .fi-ta-cell:nth-child(${index})`] : [`.fi-ta .fi-ta-row:nth-child(${index})`])
}
