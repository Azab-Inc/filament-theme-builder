<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// PROTOTYPE: three same-origin hover-inspection treatments, switchable via ?inspect=1&variant=A|B|C.
type Variant = 'A' | 'B' | 'C'
type InspectionTarget = {
  id: string
  name: string
  kind: string
  classes: string[]
  section: string | null
  editable: string[]
}

const props = defineProps<{ initialVariant: string }>()
const variants: Variant[] = ['A', 'B', 'C']
const variantNames: Record<Variant, string> = {
  A: 'Docked inspector',
  B: 'Anchored tooltip',
  C: 'Split-context inspector',
}
const targets: Record<string, InspectionTarget> = {
  widget: {
    id: 'widget',
    name: 'Dashboard stats widget',
    kind: 'Widget · StatsOverviewWidget',
    classes: ['fi-wi-stats-overview', 'grid gap-6'],
    section: 'widgets.stats',
    editable: ['surface.elevated', 'radius', 'shadow'],
  },
  card: {
    id: 'card',
    name: 'Recent orders card',
    kind: 'Card · Section',
    classes: ['fi-section', 'rounded-xl border'],
    section: 'surfaces.card',
    editable: ['surface.card', 'border.default', 'radius'],
  },
  navigation: {
    id: 'navigation',
    name: 'Orders navigation item',
    kind: 'Navigation · Item',
    classes: ['fi-sidebar-item', 'fi-active'],
    section: 'navigation.sidebar',
    editable: ['surface.sidebar', 'text.primary', 'radius'],
  },
  page: {
    id: 'page',
    name: 'Dashboard page surface',
    kind: 'Page · Main content',
    classes: ['fi-main', 'bg-gray-50'],
    section: 'surfaces.page',
    editable: ['surface.page', 'spacing.6'],
  },
  unmapped: {
    id: 'unmapped',
    name: 'Custom chart decoration',
    kind: 'Detected element · custom markup',
    classes: ['custom-chart-accent', 'inline-flex'],
    section: null,
    editable: [],
  },
}

const activeVariant = ref<Variant>(
  variants.includes(props.initialVariant as Variant) ? (props.initialVariant as Variant) : 'A',
)
const autoScroll = ref(true)
const hoveredId = ref<string | null>(null)
const pinnedId = ref<string | null>(null)
const pointer = ref({ x: 24, y: 24 })
const layoutMode = ref<'Sidebar' | 'Top navigation'>('Sidebar')
const currentTarget = computed(() => {
  const id = pinnedId.value ?? hoveredId.value
  return id ? targets[id] ?? null : null
})
const isPinned = computed(() => pinnedId.value !== null)
const anchoredStyle = computed(() => ({
  left: `${Math.min(pointer.value.x + 16, window.innerWidth - 310)}px`,
  top: `${Math.min(pointer.value.y + 16, window.innerHeight - 330)}px`,
}))
let hoverTimer: ReturnType<typeof setTimeout> | undefined

function updateUrl(variant: Variant): void {
  activeVariant.value = variant
  const url = new URL(window.location.href)
  url.searchParams.set('inspect', '1')
  url.searchParams.set('variant', variant)
  window.history.replaceState({}, '', url)
}

function stepVariant(direction: number): void {
  const index = variants.indexOf(activeVariant.value)
  updateUrl(variants[(index + direction + variants.length) % variants.length]!)
}

function inspect(id: string, event?: MouseEvent): void {
  if (event) pointer.value = { x: event.clientX, y: event.clientY }
  if (pinnedId.value) return
  if (hoverTimer) clearTimeout(hoverTimer)
  const target = targets[id]
  if (!target) return
  const reveal = () => {
    hoveredId.value = id
    if (autoScroll.value && target.section) {
      document.querySelector(`[data-editor-section="${target.section}"]`)?.scrollIntoView?.({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
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

function unpin(): void {
  pinnedId.value = null
  hoveredId.value = null
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target
  if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
  if (event.key === 'Escape') {
    unpin()
    return
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    stepVariant(event.key === 'ArrowRight' ? 1 : -1)
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (hoverTimer) clearTimeout(hoverTimer)
})
</script>

<template>
  <main class="inspect" :class="`inspect--${activeVariant.toLowerCase()}`" :data-hover-inspect-prototype="activeVariant">
    <header class="inspect__topbar">
      <div class="inspect__brand"><span class="inspect__mark">F</span> Filament <b>Theme Builder</b></div>
      <div class="inspect__prototype-label"><strong>PROTOTYPE</strong> Same-origin interaction sample · no persistence</div>
      <div class="inspect__top-actions"><span class="inspect__mode">Light mode</span><span>⌘ Z</span></div>
    </header>

    <section class="inspect__workspace" aria-label="Throwaway inspection workspace">
      <aside class="inspect__editor" aria-label="Theme editor sample">
        <div class="inspect__editor-heading"><div><small>THEME EDITOR · SAMPLE</small><h1>Inspect a surface</h1></div><div class="inspect__layout-toggle" aria-label="Editor layout mode">
          <button type="button" :aria-pressed="layoutMode === 'Sidebar'" @click="layoutMode = 'Sidebar'">Sidebar</button>
          <button type="button" :aria-pressed="layoutMode === 'Top navigation'" @click="layoutMode = 'Top navigation'">Top navigation</button>
        </div></div>
        <p class="inspect__hint">Hover a mapped part of the local demo. Click to pin its inspection details.</p>
        <div class="inspect__editor-nav" :class="layoutMode === 'Sidebar' ? 'inspect__editor-nav--vertical' : 'inspect__editor-nav--horizontal'"><span :class="{ 'is-active': layoutMode === 'Sidebar' }">Navigation · {{ layoutMode }}</span><span>Foundations</span><span>Components</span></div>
        <section class="inspect__editor-section" data-editor-section="navigation.sidebar" :data-editor-highlight="currentTarget?.section === 'navigation.sidebar' ? 'navigation.sidebar' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'navigation.sidebar' }"><small>01 · NAVIGATION</small><h2>Sidebar</h2><div class="inspect__token"><span>Active item</span><code>primary / 600</code></div></section>
        <section class="inspect__editor-section" data-editor-section="surfaces.page" :data-editor-highlight="currentTarget?.section === 'surfaces.page' ? 'surfaces.page' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'surfaces.page' }"><small>02 · SURFACES</small><h2>Page</h2><div class="inspect__token"><span>Canvas</span><code>#F4F5F7</code></div></section>
        <section class="inspect__editor-section" data-editor-section="surfaces.card" :data-editor-highlight="currentTarget?.section === 'surfaces.card' ? 'surfaces.card' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'surfaces.card' }"><small>03 · SURFACES</small><h2>Card</h2><div class="inspect__token"><span>Surface</span><code>#FFFFFF</code></div></section>
        <section class="inspect__editor-section" data-editor-section="widgets.stats" :data-editor-highlight="currentTarget?.section === 'widgets.stats' ? 'widgets.stats' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'widgets.stats' }"><small>04 · WIDGETS</small><h2>Stats overview</h2><div class="inspect__token"><span>Radius</span><code>xl · shadow-sm</code></div></section>
        <div class="inspect__editor-section inspect__unmapped-note"><small>NOT LINKED</small><p>Custom demo elements can be detected without an editable theme mapping.</p></div>
      </aside>

      <section class="inspect__demo-wrap" aria-label="Same-origin mock Filament demo">
        <div class="inspect__demo-caption"><span><i></i> LOCAL FILAMENT-LIKE DEMO</span><span>admin / dashboard · mock surface</span></div>
        <div class="inspect__demo">
          <nav class="inspect__sidebar" aria-label="Mock Filament navigation">
            <div class="inspect__demo-brand">◈ <b>Acme Admin</b></div>
            <button type="button" class="inspect__demo-nav" data-inspect-target="navigation" tabindex="0" @mouseenter="inspect('navigation', $event)" @mousemove="inspect('navigation', $event)" @mouseleave="clearHover" @focus="inspect('navigation')" @blur="clearHover" @click="pin('navigation')">◫ <span>Orders</span><b>12</b></button>
            <div class="inspect__demo-nav inspect__demo-nav--plain">▦ <span>Customers</span></div><div class="inspect__demo-nav inspect__demo-nav--plain">⌁ <span>Products</span></div>
          </nav>
          <div class="inspect__demo-main" data-inspect-target="page" tabindex="0" @mouseenter.self="inspect('page', $event)" @mousemove.self="inspect('page', $event)" @mouseleave.self="clearHover" @focus="inspect('page')" @blur="clearHover" @click.self="pin('page')">
            <div class="inspect__demo-heading"><div><small>OVERVIEW</small><h2>Dashboard</h2></div><button type="button">Last 30 days⌄</button></div>
            <section class="inspect__widget" data-inspect-target="widget" tabindex="0" @mouseenter="inspect('widget', $event)" @mousemove="inspect('widget', $event)" @mouseleave="clearHover" @focus="inspect('widget')" @blur="clearHover" @click="pin('widget')">
              <div class="inspect__stat"><small>Revenue</small><b>$48,290</b><span>↗ 12.8%</span></div><div class="inspect__stat"><small>New orders</small><b>1,284</b><span>↗ 8.2%</span></div><div class="inspect__stat"><small>Avg. order</small><b>$37.61</b><span>↗ 2.4%</span></div>
            </section>
            <section class="inspect__card" data-inspect-target="card" tabindex="0" @mouseenter="inspect('card', $event)" @mousemove="inspect('card', $event)" @mouseleave="clearHover" @focus="inspect('card')" @blur="clearHover" @click="pin('card')">
              <div class="inspect__card-heading"><div><small>RECENT ACTIVITY</small><b>Recent orders</b></div><button type="button">View all</button></div>
              <div class="inspect__table-row"><span>Olivia Rhye</span><span>Order #1042</span><b>$240.00</b></div><div class="inspect__table-row"><span>Phoenix Baker</span><span>Order #1041</span><b>$120.00</b></div><div class="inspect__table-row"><span>Lana Steiner</span><span>Order #1040</span><b>$86.50</b></div>
              <span class="inspect__unmapped" data-inspect-target="unmapped" tabindex="0" @mouseenter.stop="inspect('unmapped', $event)" @mousemove.stop="inspect('unmapped', $event)" @mouseleave="clearHover" @focus="inspect('unmapped')" @blur="clearHover" @click.stop="pin('unmapped')">custom chart accent</span>
            </section>
            <div v-if="activeVariant === 'C' && currentTarget" class="inspect__split-chip" :class="{ 'is-unmapped': !currentTarget.section }" data-inspector-details>
              <button type="button" aria-label="Close inspector" @click.stop="unpin">×</button><small>{{ isPinned ? 'PINNED' : 'HOVER INSPECT' }} · {{ currentTarget.kind }}</small><b>{{ currentTarget.name }}</b><span>{{ currentTarget.section ? `Editor · ${currentTarget.section}` : 'Detected, but not mapped · No editor section is linked' }}</span><code v-for="className in currentTarget.classes" :key="className">.{{ className }}</code><code v-for="token in currentTarget.editable" :key="token">{{ token }}</code>
            </div>
          </div>
        </div>
        <div class="inspect__sample-note">This is a same-origin interaction sample, not the demo bridge or a live Filament iframe.</div>
      </section>
    </section>

    <aside v-if="currentTarget && activeVariant !== 'C'" class="inspect__details" :class="{ 'inspect__details--anchored': activeVariant === 'B' }" :style="activeVariant === 'B' ? anchoredStyle : undefined" data-inspector-details aria-live="polite">
      <button type="button" class="inspect__close" aria-label="Close inspector" @click="unpin">×</button>
      <small>{{ isPinned ? 'PINNED INSPECTION' : 'HOVER INSPECTION' }}</small><h2>{{ currentTarget.name }}</h2><p class="inspect__kind">{{ currentTarget.kind }}</p>
      <div v-if="currentTarget.section" class="inspect__mapping"><span>EDITOR MAPPING</span><b>{{ currentTarget.section }}</b></div>
      <div v-else class="inspect__unmapped-state"><b>Detected, but not mapped</b><span>No editor section is linked. This target will not scroll the editor.</span></div>
      <div class="inspect__detail-block"><span>DETECTED CLASSES</span><code v-for="className in currentTarget.classes" :key="className">.{{ className }}</code></div>
      <div v-if="currentTarget.editable.length" class="inspect__detail-block"><span>EDITABLE TOKENS</span><code v-for="token in currentTarget.editable" :key="token">{{ token }}</code></div>
      <div class="inspect__detail-footer">{{ isPinned ? 'Click close or press Escape to unpin' : 'Click target to pin · Tab to inspect' }}</div>
    </aside>

    <nav class="inspect__variant-bar" aria-label="Inspection prototype variants">
      <button type="button" aria-label="Previous variant" @click="stepVariant(-1)">←</button><span class="inspect__variant-current"><b>{{ activeVariant }}</b><span>{{ variantNames[activeVariant] }}</span></span>
      <div class="inspect__variant-choices"><button v-for="variant in variants" :key="variant" type="button" :aria-label="`Variant ${variant}`" :aria-current="activeVariant === variant ? 'true' : undefined" @click="updateUrl(variant)">{{ variant }}</button></div>
      <label class="inspect__auto-scroll"><input v-model="autoScroll" type="checkbox" /> Auto-scroll</label><span class="inspect__key-hint"><kbd>←</kbd><kbd>→</kbd> switch · <kbd>Esc</kbd> close</span><button type="button" aria-label="Next variant" @click="stepVariant(1)">→</button>
    </nav>
  </main>
</template>
