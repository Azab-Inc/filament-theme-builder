export type InspectorVisualState = 'default' | 'hover' | 'focus' | 'selected'

export function selectorForInspectorState(selector: string, state: InspectorVisualState): string | null {
  const base = selector === '.fi-sidebar-item.fi-active .fi-sidebar-item-label'
    || /^\.fi-sidebar-item-btn:(?:hover|focus) \.fi-sidebar-item-label$/.test(selector)
    ? '.fi-sidebar-item-label'
    : selector.replace(/:hover|:focus/g, '').trim()
  if (!/^\.fi-[\w-]+(?:\.[\w-]+)*(?:\s+\.fi-[\w-]+(?:\.[\w-]+)*)*$/.test(base)) return null
  if (state === 'default') return base
  if (state === 'selected') return base === '.fi-sidebar-item-label'
    ? '.fi-sidebar-item.fi-active .fi-sidebar-item-label'
    : null
  if (base === '.fi-sidebar-item-label') {
    return state === 'hover'
      ? '.fi-sidebar-item-btn:hover .fi-sidebar-item-label'
      : '.fi-sidebar-item-btn:focus .fi-sidebar-item-label'
  }
  return `${base}:${state}`
}

export function inspectorStateForSelector(selector: string): InspectorVisualState {
  if (selector === '.fi-sidebar-item.fi-active .fi-sidebar-item-label') return 'selected'
  if (selector.includes(':hover')) return 'hover'
  if (selector.includes(':focus')) return 'focus'
  return 'default'
}
