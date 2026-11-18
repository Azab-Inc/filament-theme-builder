<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
defineProps<{ label: string; ariaLabel: string }>()
const menu = ref<HTMLDetailsElement | null>(null)
function dismissOutside(event: PointerEvent): void {
  if (document.querySelector('[data-toolbar-menu-modal]')) return
  const target = event.target as Node | null
  if (target && !menu.value?.contains(target)) menu.value?.removeAttribute('open')
  if (target) document.querySelectorAll<HTMLDetailsElement>('[data-toolbar-menu][open]').forEach((item) => {
    if (item !== menu.value && !item.contains(target)) item.removeAttribute('open')
  })
}
function dismissEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !menu.value?.open) return
  event.preventDefault()
  menu.value.removeAttribute('open')
  menu.value.querySelector('summary')?.focus()
}
function closeAfterAction(event: MouseEvent): void {
  const target = event.target as Element | null
  if (!target?.closest('button') || target.closest('[data-local-theme-manager], [aria-label="Local client pairing"]')) return
  menu.value?.removeAttribute('open')
}
function keepMenusExclusive(): void {
  if (!menu.value?.open) return
  document.querySelectorAll<HTMLDetailsElement>('[data-toolbar-menu][open]').forEach((item) => {
    if (item !== menu.value) item.removeAttribute('open')
  })
}
onMounted(() => {
  document.addEventListener('pointerdown', dismissOutside, true)
  document.addEventListener('keydown', dismissEscape)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', dismissOutside, true)
  document.removeEventListener('keydown', dismissEscape)
})
</script>

<template>
  <details ref="menu" class="toolbar-menu" data-toolbar-menu @toggle="keepMenusExclusive">
    <summary :aria-label="ariaLabel">{{ label }}</summary>
    <div class="toolbar-menu__panel" @click="closeAfterAction"><slot /></div>
  </details>
</template>
