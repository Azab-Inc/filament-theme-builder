<script setup lang="ts">
import type { HoverInspectPrototypeTarget } from '@/models/hover-inspect-prototype-target.model'

defineProps<{ currentTarget: HoverInspectPrototypeTarget | null; layoutMode: 'Sidebar' | 'Top navigation' }>()
const emit = defineEmits<{ 'update:layoutMode': [value: 'Sidebar' | 'Top navigation'] }>()
</script>

<template>
  <aside class="inspect__editor" aria-label="Theme editor sample">
    <div class="inspect__editor-heading"><div><small>THEME EDITOR · SAMPLE</small><h1>Inspect a surface</h1></div><div class="inspect__layout-toggle" aria-label="Editor layout mode">
      <button type="button" :aria-pressed="layoutMode === 'Sidebar'" @click="emit('update:layoutMode', 'Sidebar')">Sidebar</button>
      <button type="button" :aria-pressed="layoutMode === 'Top navigation'" @click="emit('update:layoutMode', 'Top navigation')">Top navigation</button>
    </div></div>
    <p class="inspect__hint">Hover a mapped part of the local demo. Click to pin its inspection details.</p>
    <div class="inspect__editor-nav" :class="layoutMode === 'Sidebar' ? 'inspect__editor-nav--vertical' : 'inspect__editor-nav--horizontal'"><span :class="{ 'is-active': layoutMode === 'Sidebar' }">Navigation · {{ layoutMode }}</span><span>Foundations</span><span>Components</span></div>
    <section class="inspect__editor-section" data-editor-section="navigation.sidebar" :data-editor-highlight="currentTarget?.section === 'navigation.sidebar' ? 'navigation.sidebar' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'navigation.sidebar' }"><small>01 · NAVIGATION</small><h2>Sidebar</h2><div class="inspect__token"><span>Active item</span><code>primary / 600</code></div></section>
    <section class="inspect__editor-section" data-editor-section="surfaces.page" :data-editor-highlight="currentTarget?.section === 'surfaces.page' ? 'surfaces.page' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'surfaces.page' }"><small>02 · SURFACES</small><h2>Page</h2><div class="inspect__token"><span>Canvas</span><code>#F4F5F7</code></div></section>
    <section class="inspect__editor-section" data-editor-section="surfaces.card" :data-editor-highlight="currentTarget?.section === 'surfaces.card' ? 'surfaces.card' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'surfaces.card' }"><small>03 · SURFACES</small><h2>Card</h2><div class="inspect__token"><span>Surface</span><code>#FFFFFF</code></div></section>
    <section class="inspect__editor-section" data-editor-section="widgets.stats" :data-editor-highlight="currentTarget?.section === 'widgets.stats' ? 'widgets.stats' : undefined" :class="{ 'is-highlighted': currentTarget?.section === 'widgets.stats' }"><small>04 · WIDGETS</small><h2>Stats overview</h2><div class="inspect__token"><span>Radius</span><code>xl · shadow-sm</code></div></section>
    <div class="inspect__editor-section inspect__unmapped-note"><small>NOT LINKED</small><p>Custom demo elements can be detected without an editable theme mapping.</p></div>
  </aside>
</template>
