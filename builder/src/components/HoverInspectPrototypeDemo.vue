<script setup lang="ts">
import type { HoverInspectPrototypeTarget } from '@/models/hover-inspect-prototype-target.model'
import type { HoverInspectPrototypeVariant } from '@/models/hover-inspect-prototype-variant.model'

defineProps<{ currentTarget: HoverInspectPrototypeTarget | null; activeVariant: HoverInspectPrototypeVariant; isPinned: boolean }>()
const emit = defineEmits<{ inspect: [id: string, event?: MouseEvent]; clear: []; pin: [id: string]; unpin: [] }>()
</script>

<template>
  <section class="inspect__demo-wrap" aria-label="Same-origin mock Filament demo">
    <div class="inspect__demo-caption"><span><i></i> LOCAL FILAMENT-LIKE DEMO</span><span>admin / dashboard · mock surface</span></div>
    <div class="inspect__demo">
      <nav class="inspect__sidebar" aria-label="Mock Filament navigation">
        <div class="inspect__demo-brand">◈ <b>Acme Admin</b></div>
        <button type="button" class="inspect__demo-nav" data-inspect-target="navigation" tabindex="0" @mouseenter="emit('inspect', 'navigation', $event)" @mousemove="emit('inspect', 'navigation', $event)" @mouseleave="emit('clear')" @focus="emit('inspect', 'navigation')" @blur="emit('clear')" @click="emit('pin', 'navigation')">◫ <span>Orders</span><b>12</b></button>
        <div class="inspect__demo-nav inspect__demo-nav--plain">▦ <span>Customers</span></div><div class="inspect__demo-nav inspect__demo-nav--plain">⌁ <span>Products</span></div>
      </nav>
      <div class="inspect__demo-main" data-inspect-target="page" tabindex="0" @mouseenter.self="emit('inspect', 'page', $event)" @mousemove.self="emit('inspect', 'page', $event)" @mouseleave.self="emit('clear')" @focus="emit('inspect', 'page')" @blur="emit('clear')" @click.self="emit('pin', 'page')">
        <div class="inspect__demo-heading"><div><small>OVERVIEW</small><h2>Dashboard</h2></div><button type="button">Last 30 days⌄</button></div>
        <section class="inspect__widget" data-inspect-target="widget" tabindex="0" @mouseenter="emit('inspect', 'widget', $event)" @mousemove="emit('inspect', 'widget', $event)" @mouseleave="emit('clear')" @focus="emit('inspect', 'widget')" @blur="emit('clear')" @click="emit('pin', 'widget')">
          <div class="inspect__stat"><small>Revenue</small><b>$48,290</b><span>↗ 12.8%</span></div><div class="inspect__stat"><small>New orders</small><b>1,284</b><span>↗ 8.2%</span></div><div class="inspect__stat"><small>Avg. order</small><b>$37.61</b><span>↗ 2.4%</span></div>
        </section>
        <section class="inspect__card" data-inspect-target="card" tabindex="0" @mouseenter="emit('inspect', 'card', $event)" @mousemove="emit('inspect', 'card', $event)" @mouseleave="emit('clear')" @focus="emit('inspect', 'card')" @blur="emit('clear')" @click="emit('pin', 'card')">
          <div class="inspect__card-heading"><div><small>RECENT ACTIVITY</small><b>Recent orders</b></div><button type="button">View all</button></div>
          <div class="inspect__table-row"><span>Olivia Rhye</span><span>Order #1042</span><b>$240.00</b></div><div class="inspect__table-row"><span>Phoenix Baker</span><span>Order #1041</span><b>$120.00</b></div><div class="inspect__table-row"><span>Lana Steiner</span><span>Order #1040</span><b>$86.50</b></div>
          <span class="inspect__unmapped" data-inspect-target="unmapped" tabindex="0" @mouseenter.stop="emit('inspect', 'unmapped', $event)" @mousemove.stop="emit('inspect', 'unmapped', $event)" @mouseleave="emit('clear')" @focus="emit('inspect', 'unmapped')" @blur="emit('clear')" @click.stop="emit('pin', 'unmapped')">custom chart accent</span>
        </section>
        <div v-if="activeVariant === 'C' && currentTarget" class="inspect__split-chip" :class="{ 'is-unmapped': !currentTarget.section }" data-inspector-details>
          <button type="button" aria-label="Close inspector" @click.stop="emit('unpin')">×</button><small>{{ isPinned ? 'PINNED' : 'HOVER INSPECT' }} · {{ currentTarget.kind }}</small><b>{{ currentTarget.name }}</b><span>{{ currentTarget.section ? `Editor · ${currentTarget.section}` : 'Detected, but not mapped · No editor section is linked' }}</span><code v-for="className in currentTarget.classes" :key="className">.{{ className }}</code><code v-for="token in currentTarget.editable" :key="token">{{ token }}</code>
        </div>
      </div>
    </div>
    <div class="inspect__sample-note">This is a same-origin interaction sample, not the demo bridge or a live Filament iframe.</div>
  </section>
</template>
