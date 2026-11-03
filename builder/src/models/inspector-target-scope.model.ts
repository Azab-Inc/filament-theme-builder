export const INSPECTOR_COLUMN_LIMIT = 32
export type InspectorSurfaceKind = 'table-container' | 'table-header' | 'table-body' | 'table-row' | 'chart-surface' | 'topbar-search-surface'
export type InspectorColumnPart = 'header' | 'body' | 'row'
export type InspectorTargetScope =
  | { kind: InspectorSurfaceKind }
  | { kind: 'table-column'; columnIndex: number; parts: readonly InspectorColumnPart[] }
