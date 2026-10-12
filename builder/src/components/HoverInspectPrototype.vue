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

<style scoped>
.inspect{--ink:#222b3c;--muted:#758198;--line:#e3e8f0;--paper:#f5f7fb;position:relative;min-height:100vh;background:var(--paper);color:var(--ink);font:13px/1.45 Inter,ui-sans-serif,system-ui,sans-serif;padding-bottom:76px}.inspect__topbar{height:58px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 24px}.inspect__brand{display:flex;align-items:center;gap:8px;font-size:14px}.inspect__brand b{font-weight:500;color:#657089}.inspect__mark{display:grid;place-items:center;border-radius:7px;background:#26344d;color:#fff;width:26px;height:26px;font:17px Georgia}.inspect__prototype-label{font-size:11px;color:#707c91}.inspect__prototype-label strong{margin-right:8px;padding:4px 7px;background:#fff3db;color:#a45b10;letter-spacing:.08em;border-radius:4px;font-size:9px}.inspect__top-actions{display:flex;gap:20px;color:#8590a3;font-size:11px}.inspect__mode{color:#42516b}.inspect__workspace{display:grid;grid-template-columns:minmax(300px,390px) minmax(500px,1fr);gap:20px;max-width:1440px;margin:24px auto;padding:0 24px}.inspect__editor,.inspect__demo-wrap{background:#fff;border:1px solid var(--line);border-radius:10px;min-width:0}.inspect__editor{padding:20px;max-height:calc(100vh - 170px);overflow:auto}.inspect__editor-heading{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.inspect__editor-heading small,.inspect__editor-section small,.inspect__card-heading small{font-size:9px;letter-spacing:.1em;color:#8994a7}.inspect__editor h1{font-size:20px;margin:5px 0}.inspect__hint{color:var(--muted);font-size:11px;margin:6px 0 18px}.inspect__layout-toggle{display:flex;padding:3px;background:#f0f3f8;border-radius:6px}.inspect__layout-toggle button{border:0;background:transparent;padding:5px 7px;border-radius:4px;color:#69758a;font-size:10px}.inspect__layout-toggle button[aria-pressed=true]{background:#fff;color:#27354e;box-shadow:0 1px 3px #1e293b1c}.inspect__editor-nav{display:flex;gap:15px;border-bottom:1px solid var(--line);padding:10px 0;color:#77839a;font-size:10px}.inspect__editor-nav .is-active{color:#3d65c6}.inspect__editor-section{padding:13px 10px;border-bottom:1px solid #edf0f5;transition:background .15s,border-color .15s}.inspect__editor-section.is-highlighted{background:#edf4ff;border-left:3px solid #4778dc;padding-left:7px;scroll-margin:14px}.inspect__editor-section h2{font-size:13px;margin:4px 0 8px}.inspect__token{display:flex;justify-content:space-between;color:#6f7c91;font-size:10px}.inspect__token code{font:10px ui-monospace,monospace;color:#3f5d9c}.inspect__unmapped-note p{margin:5px 0 0;color:var(--muted);font-size:10px}.inspect__demo-wrap{overflow:hidden;align-self:start}.inspect__demo-caption{display:flex;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--line);font-size:9px;letter-spacing:.08em;color:#8290a4}.inspect__demo-caption i{display:inline-block;width:6px;height:6px;background:#46a77b;border-radius:50%;margin-right:5px}.inspect__demo{min-height:610px;background:#f6f8fb;display:grid;grid-template-columns:176px minmax(0,1fr);position:relative}.inspect__sidebar{background:#fff;border-right:1px solid var(--line);padding:15px 10px}.inspect__demo-brand{padding:7px 9px 20px;font-size:12px;color:#2d3e5b}.inspect__demo-nav{display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:0;background:#edf3ff;color:#365ca4;border-radius:6px;padding:9px;font:11px inherit;cursor:pointer}.inspect__demo-nav span{flex:1}.inspect__demo-nav b{font-size:9px}.inspect__demo-nav--plain{background:transparent;color:#758198;margin-top:4px}.inspect__demo-main{position:relative;padding:24px;min-width:0}.inspect__demo-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.inspect__demo-heading small{font-size:9px;letter-spacing:.12em;color:#8994a7}.inspect__demo-heading h2{margin:3px 0;font-size:21px}.inspect__demo-heading button,.inspect__card-heading button{border:1px solid var(--line);background:#fff;border-radius:5px;padding:7px 9px;font-size:10px;color:#59677e}.inspect__widget{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;cursor:pointer}.inspect__stat,.inspect__card{background:#fff;border:1px solid var(--line);border-radius:8px}.inspect__stat{padding:13px}.inspect__stat small{display:block;font-size:9px;color:#8792a5}.inspect__stat b{display:block;margin:7px 0;font-size:18px}.inspect__stat span{font-size:9px;color:#3a9b70}.inspect__card{position:relative;padding:14px 16px;cursor:pointer}.inspect__card-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.inspect__card-heading b{display:block;margin-top:3px;font-size:12px}.inspect__table-row{display:grid;grid-template-columns:1.1fr 1fr auto;padding:10px 0;border-top:1px solid #eef1f5;font-size:10px;color:#647188}.inspect__table-row b{color:#35435a}.inspect__unmapped{position:absolute;right:15px;bottom:8px;color:#bc6088;font-size:8px;border:1px dashed #df9fb8;padding:2px 5px;border-radius:3px;cursor:pointer}.inspect__sample-note{padding:10px 18px;color:#929bad;font-size:10px;border-top:1px solid var(--line)}.inspect__demo--topnav{display:block}.inspect__demo--topnav .inspect__sidebar{display:flex;align-items:center;border-right:0;border-bottom:1px solid var(--line);padding:6px 14px;gap:12px}.inspect__demo--topnav .inspect__demo-brand{padding:8px}.inspect__demo--topnav .inspect__demo-nav{width:auto}.inspect__demo--topnav .inspect__demo-nav--plain{padding:9px}.inspect__details{position:fixed;z-index:10;right:22px;top:78px;width:290px;padding:18px;background:#fff;border:1px solid #dbe3ef;border-radius:10px;box-shadow:0 15px 45px #25334b25}.inspect__details--anchored{position:fixed;right:auto;top:100px}.inspect__close{position:absolute;right:10px;top:8px;border:0;background:transparent;color:#758198;font-size:21px;cursor:pointer}.inspect__details>small,.inspect__detail-block>span,.inspect__mapping>span{font-size:9px;letter-spacing:.1em;color:#71809a}.inspect__details h2{margin:7px 20px 2px 0;font-size:16px}.inspect__kind{margin:0 0 14px;color:#8792a5;font-size:10px}.inspect__mapping{padding:10px;background:#f1f6ff;border-radius:6px}.inspect__mapping b{display:block;margin-top:4px;color:#365c9c;font:11px ui-monospace,monospace}.inspect__unmapped-state{padding:10px;background:#fff7ed;border:1px solid #ffdfb4;border-radius:6px;color:#965916}.inspect__unmapped-state b,.inspect__unmapped-state span{display:block;font-size:10px}.inspect__unmapped-state span{margin-top:4px;color:#a0784a}.inspect__detail-block{display:flex;flex-wrap:wrap;gap:5px;margin-top:12px}.inspect__detail-block>span{width:100%}.inspect__detail-block code{background:#f2f4f8;border-radius:4px;padding:4px 6px;font:9px ui-monospace,monospace;color:#53617a}.inspect__detail-footer{border-top:1px solid var(--line);margin-top:14px;padding-top:10px;color:#8994a7;font-size:9px}.inspect__split-chip{position:absolute;right:18px;top:18px;width:220px;padding:12px;background:#fff;border:1px solid #8aabe9;border-radius:8px;box-shadow:0 8px 25px #25334b20}.inspect__split-chip button{float:right;border:0;background:transparent;font-size:17px}.inspect__split-chip small,.inspect__split-chip span{display:block;color:#5872a3;font-size:9px}.inspect__split-chip b{display:block;margin:5px 0;font-size:11px}.inspect__split-chip.is-unmapped{border-color:#e7b773}.inspect__variant-bar{position:fixed;z-index:20;bottom:14px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:11px;padding:8px 11px;background:#222d40;color:#fff;border:1px solid #47536a;border-radius:12px;box-shadow:0 12px 35px #17203355;white-space:nowrap}.inspect__variant-bar>button{border:0;border-radius:6px;width:28px;height:28px;background:#354158;color:#fff;font-size:17px;cursor:pointer}.inspect__variant-current{display:flex;align-items:center;gap:7px;min-width:142px}.inspect__variant-current>b{font-size:13px}.inspect__variant-current>span{font-size:10px;color:#c0cad9}.inspect__variant-choices{display:flex;gap:3px;border-left:1px solid #526077;padding-left:8px}.inspect__variant-choices button{border:0;border-radius:4px;background:transparent;color:#c1cbda;padding:5px 7px;font-size:10px}.inspect__variant-choices button[aria-current=true]{background:#fff;color:#24334c}.inspect__auto-scroll{display:flex;align-items:center;gap:5px;font-size:9px;color:#d7deea;border-left:1px solid #526077;padding-left:8px}.inspect__key-hint{font-size:8px;color:#aab5c5}.inspect__key-hint kbd{padding:2px 4px;border:1px solid #66738a;border-radius:3px;font:8px ui-monospace,monospace}.inspect--a .inspect__workspace{grid-template-columns:minmax(280px,360px) minmax(400px,1fr);padding-right:340px}.inspect--a .inspect__details{position:fixed;top:78px;right:22px;width:290px}.inspect--b .inspect__workspace{grid-template-columns:minmax(270px,320px) minmax(450px,1fr)}.inspect--c .inspect__workspace{grid-template-columns:minmax(280px,380px) minmax(450px,1fr)}.inspect--c .inspect__editor{border-top:4px solid #7896d1}@media(max-width:900px){.inspect__workspace,.inspect--a .inspect__workspace{grid-template-columns:1fr;padding:0 12px}.inspect__editor{max-height:340px;order:2}.inspect__demo-wrap{order:1}.inspect--a .inspect__workspace{padding-right:12px}.inspect__details{top:auto!important;bottom:82px!important;left:auto!important;right:12px;width:min(290px,calc(100vw - 24px))}.inspect__prototype-label{display:none}.inspect__variant-bar{max-width:calc(100vw - 16px);gap:6px}.inspect__key-hint{display:none}}@media(max-width:560px){.inspect__topbar{padding:0 12px}.inspect__top-actions{gap:8px}.inspect__workspace{margin-top:12px}.inspect__demo{grid-template-columns:118px minmax(0,1fr);min-height:530px}.inspect__sidebar{padding:10px 6px}.inspect__demo-main{padding:14px 10px}.inspect__widget{grid-template-columns:1fr}.inspect__stat{padding:8px}.inspect__stat b{font-size:15px}.inspect__table-row{grid-template-columns:1fr auto;gap:4px}.inspect__table-row span:nth-child(2){display:none}.inspect__editor-heading{display:block}.inspect__layout-toggle{margin-top:8px;width:max-content}.inspect__variant-current{min-width:0}.inspect__variant-current>span{display:none}.inspect__auto-scroll{font-size:0}.inspect__auto-scroll input{margin:0}}
.inspect__editor-nav--vertical{flex-direction:column;align-items:stretch}
.inspect__editor-nav--horizontal{flex-direction:row;align-items:center}
</style>
