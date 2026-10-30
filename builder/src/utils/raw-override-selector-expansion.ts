const sidebarLabelSelector = /^(?:(\.fi-sidebar-item-btn:(?:hover|focus)|\.fi-sidebar-item\.fi-active) )?\.fi-sidebar-item-label$/

export function expandRawOverrideSelectors(selector: string): string[] {
  const match = sidebarLabelSelector.exec(selector)
  if (!match) return [selector]
  const prefix = match[1] ? `${match[1]} ` : ''
  return [selector, `${prefix}.fi-sidebar-item-icon`]
}
