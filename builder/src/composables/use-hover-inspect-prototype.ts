import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { HoverInspectPrototypeTarget } from '@/models/hover-inspect-prototype-target.model'
import type { HoverInspectPrototypeVariant } from '@/models/hover-inspect-prototype-variant.model'

export const prototypeVariants: HoverInspectPrototypeVariant[] = ['A', 'B', 'C']
export const prototypeVariantNames: Record<HoverInspectPrototypeVariant, string> = {
  A: 'Docked inspector', B: 'Anchored tooltip', C: 'Split-context inspector',
}
export const prototypeTargets: Record<string, HoverInspectPrototypeTarget> = {
  widget: { id: 'widget', name: 'Dashboard stats widget', kind: 'Widget · StatsOverviewWidget', classes: ['fi-wi-stats-overview', 'grid gap-6'], section: 'widgets.stats', editable: ['surface.elevated', 'radius', 'shadow'] },
  card: { id: 'card', name: 'Recent orders card', kind: 'Card · Section', classes: ['fi-section', 'rounded-xl border'], section: 'surfaces.card', editable: ['surface.card', 'border.default', 'radius'] },
  navigation: { id: 'navigation', name: 'Orders navigation item', kind: 'Navigation · Item', classes: ['fi-sidebar-item', 'fi-active'], section: 'navigation.sidebar', editable: ['surface.sidebar', 'text.primary', 'radius'] },
  page: { id: 'page', name: 'Dashboard page surface', kind: 'Page · Main content', classes: ['fi-main', 'bg-gray-50'], section: 'surfaces.page', editable: ['surface.page', 'spacing.6'] },
  unmapped: { id: 'unmapped', name: 'Custom chart decoration', kind: 'Detected element · custom markup', classes: ['custom-chart-accent', 'inline-flex'], section: null, editable: [] },
}

export function useHoverInspectPrototype(initialVariant: string) {
  const activeVariant = ref<HoverInspectPrototypeVariant>(prototypeVariants.includes(initialVariant as HoverInspectPrototypeVariant) ? initialVariant as HoverInspectPrototypeVariant : 'A')
  const autoScroll = ref(true)
  const hoveredId = ref<string | null>(null)
  const pinnedId = ref<string | null>(null)
  const pointer = ref({ x: 24, y: 24 })
  const layoutMode = ref<'Sidebar' | 'Top navigation'>('Sidebar')
  const currentTarget = computed(() => {
    const id = pinnedId.value ?? hoveredId.value
    return id ? prototypeTargets[id] ?? null : null
  })
  const isPinned = computed(() => pinnedId.value !== null)
  const anchoredStyle = computed(() => ({
    left: `${Math.min(pointer.value.x + 16, window.innerWidth - 310)}px`,
    top: `${Math.min(pointer.value.y + 16, window.innerHeight - 330)}px`,
  }))
  let hoverTimer: ReturnType<typeof setTimeout> | undefined

  function updateUrl(variant: HoverInspectPrototypeVariant): void {
    activeVariant.value = variant
    const url = new URL(window.location.href)
    url.searchParams.set('inspect', '1')
    url.searchParams.set('variant', variant)
    window.history.replaceState({}, '', url)
  }
  function stepVariant(direction: number): void {
    const index = prototypeVariants.indexOf(activeVariant.value)
    updateUrl(prototypeVariants[(index + direction + prototypeVariants.length) % prototypeVariants.length]!)
  }
  function inspect(id: string, event?: MouseEvent): void {
    if (event) pointer.value = { x: event.clientX, y: event.clientY }
    if (pinnedId.value) return
    if (hoverTimer) clearTimeout(hoverTimer)
    const target = prototypeTargets[id]
    if (!target) return
    const reveal = () => {
      hoveredId.value = id
      if (autoScroll.value && target.section) document.querySelector(`[data-editor-section="${target.section}"]`)?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    }
    if (autoScroll.value) reveal()
    else hoverTimer = setTimeout(reveal, 180)
  }
  function clearHover(): void {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverTimer = undefined
    if (!pinnedId.value) hoveredId.value = null
  }
  function pin(id: string): void {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoveredId.value = id
    pinnedId.value = id
  }
  function unpin(): void { pinnedId.value = null; hoveredId.value = null }
  function handleKeydown(event: KeyboardEvent): void {
    const target = event.target
    if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
    if (event.key === 'Escape') { unpin(); return }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); stepVariant(event.key === 'ArrowRight' ? 1 : -1) }
  }
  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (hoverTimer) clearTimeout(hoverTimer)
  })
  return { activeVariant, autoScroll, currentTarget, isPinned, anchoredStyle, layoutMode, updateUrl, stepVariant, inspect, clearHover, pin, unpin }
}
