<script setup lang="ts">
import HoverInspectPrototypeDetails from '@/components/HoverInspectPrototypeDetails.vue'
import HoverInspectPrototypeDemo from '@/components/HoverInspectPrototypeDemo.vue'
import HoverInspectPrototypeEditor from '@/components/HoverInspectPrototypeEditor.vue'
import HoverInspectPrototypeVariantBar from '@/components/HoverInspectPrototypeVariantBar.vue'
import type { HoverInspectPrototypeProps } from '@/models/hover-inspect-prototype-props.model'
import { prototypeVariants, prototypeVariantNames, useHoverInspectPrototype } from '@/composables/use-hover-inspect-prototype'

// PROTOTYPE: three same-origin hover-inspection treatments, switchable via ?inspect=1&variant=A|B|C.
const props = defineProps<HoverInspectPrototypeProps>()
const {
  activeVariant, autoScroll, currentTarget, isPinned, anchoredStyle, layoutMode,
  updateUrl, stepVariant, inspect, clearHover, pin, unpin,
} = useHoverInspectPrototype(props.initialVariant)
</script>

<template>
  <main class="inspect" :class="`inspect--${activeVariant.toLowerCase()}`" :data-hover-inspect-prototype="activeVariant">
    <header class="inspect__topbar">
      <div class="inspect__brand"><span class="inspect__mark">F</span> Filament <b>Theme Builder</b></div>
      <div class="inspect__prototype-label"><strong>PROTOTYPE</strong> Same-origin interaction sample · no persistence</div>
      <div class="inspect__top-actions"><span class="inspect__mode">Light mode</span><span>⌘ Z</span></div>
    </header>
    <section class="inspect__workspace" aria-label="Throwaway inspection workspace">
      <HoverInspectPrototypeEditor v-model:layout-mode="layoutMode" :current-target="currentTarget" />
      <HoverInspectPrototypeDemo :current-target="currentTarget" :active-variant="activeVariant" :is-pinned="isPinned" @inspect="inspect" @clear="clearHover" @pin="pin" @unpin="unpin" />
    </section>
    <HoverInspectPrototypeDetails v-if="currentTarget && activeVariant !== 'C'" :target="currentTarget" :pinned="isPinned" :anchored="activeVariant === 'B'" :anchored-style="anchoredStyle" @close="unpin" />
    <HoverInspectPrototypeVariantBar :active-variant="activeVariant" :variants="prototypeVariants" :variant-names="prototypeVariantNames" :auto-scroll="autoScroll" @select="updateUrl" @step="stepVariant" @update:auto-scroll="autoScroll = $event" />
  </main>
</template>
