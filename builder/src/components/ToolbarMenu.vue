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
  <!-- impeccable-variants-start 9a3f71f1 -->
  <div data-impeccable-variants="9a3f71f1" data-impeccable-variant-count="3" style="display: contents">
    <!-- Original -->
    <div data-impeccable-variant="original">
      <details ref="menu" class="toolbar-menu" data-toolbar-menu @toggle="keepMenusExclusive">
        <summary :aria-label="ariaLabel">{{ label }}</summary>
        <div class="toolbar-menu__panel" @click="closeAfterAction"><slot /></div>
      </details>
    </div>
    <!-- Variants: insert below this line -->
    <component is="style" data-impeccable-css="9a3f71f1">
      @scope ([data-impeccable-variant="1"]) {
        :scope .toolbar-menu__panel { min-width:240px; max-width:calc(100vw - 24px); padding:6px; gap:4px; border:1px solid #cbd9d5; border-radius:6px; background:#fff; box-shadow:0 8px 24px #17352d24; }
        :scope .toolbar-menu__panel button { box-sizing:border-box; display:flex; align-items:center; min-height:36px; padding:8px 10px; width:100%; border:0; border-radius:4px; background:transparent; color:#1f3b36; font:inherit; font-weight:500; text-align:left; }
        :scope .toolbar-menu__panel button:hover { background:#e6f2ee; }
        :scope .toolbar-menu__panel [data-active-theme-name] { display:block; padding:0 10px 8px; color:#315b53; font-size:12px; }
        :scope .toolbar-menu__panel > :not(:first-child) { border-top:1px solid #dce5e2; padding-top:4px; }
        :scope .toolbar-menu__panel button:focus-visible { outline:3px solid #e2a832; outline-offset:-3px; }
        :scope .toolbar-menu__panel p { padding:4px 10px; margin:0; white-space:normal; color:#315b53; }
      }
      @scope ([data-impeccable-variant="2"]) {
        :scope .toolbar-menu__panel { min-width:260px; max-width:calc(100vw - 24px); padding:8px; gap:8px; border:1px solid #cbd9d5; border-radius:6px; background:#f3f5f4; box-shadow:0 12px 28px #17352d24; }
        :scope .toolbar-menu__panel button { box-sizing:border-box; display:flex; align-items:center; width:100%; min-height:38px; border:1px solid #dce5e2; border-radius:4px; padding:8px 12px; background:#fff; color:#1f3b36; font:inherit; font-weight:600; text-align:left; }
        :scope .toolbar-menu__panel button:hover { background:#e6f2ee; border-color:#315b53; }
        :scope .toolbar-menu__panel [data-active-theme-name] { display:block; padding:6px 12px 0; color:#315b53; font-size:12px; }
        :scope .toolbar-menu__panel button:focus-visible { outline:3px solid #e2a832; outline-offset:1px; }
        :scope .toolbar-menu__panel p { padding:8px 4px; margin:0; white-space:normal; color:#315b53; }
      }
      @scope ([data-impeccable-variant="3"]) {
        :scope .toolbar-menu__panel { min-width:220px; max-width:calc(100vw - 24px); padding:4px; gap:0; border:1px solid #cbd9d5; border-radius:4px; background:#fff; box-shadow:0 6px 18px #17352d24; }
        :scope .toolbar-menu__panel button { box-sizing:border-box; display:flex; align-items:center; width:100%; min-height:32px; border:0; border-radius:2px; padding:6px 8px; background:transparent; color:#315b53; font:inherit; text-align:left; }
        :scope .toolbar-menu__panel button:hover { background:#e6f2ee; }
        :scope .toolbar-menu__panel [data-active-theme-name] { display:block; padding:0 8px 6px; color:#315b53; font-size:12px; }
        :scope .toolbar-menu__panel > :not(:first-child) { border-top:1px solid #dce5e2; }
        :scope .toolbar-menu__panel button:focus-visible { outline:3px solid #e2a832; outline-offset:-3px; }
        :scope .toolbar-menu__panel p { padding:4px 8px; margin:0; white-space:normal; color:#315b53; }
      }
    </component>
    <div data-impeccable-variant="1"><details ref="menu" class="toolbar-menu" data-toolbar-menu @toggle="keepMenusExclusive"><summary :aria-label="ariaLabel">{{ label }}</summary><div class="toolbar-menu__panel" @click="closeAfterAction"><slot /></div></details></div>
    <div data-impeccable-variant="2" style="display:none"><details ref="menu" class="toolbar-menu" data-toolbar-menu @toggle="keepMenusExclusive"><summary :aria-label="ariaLabel">{{ label }}</summary><div class="toolbar-menu__panel" @click="closeAfterAction"><slot /></div></details></div>
    <div data-impeccable-variant="3" style="display:none"><details ref="menu" class="toolbar-menu" data-toolbar-menu @toggle="keepMenusExclusive"><summary :aria-label="ariaLabel">{{ label }}</summary><div class="toolbar-menu__panel" @click="closeAfterAction"><slot /></div></details></div>
  </div>
  <!-- impeccable-variants-end 9a3f71f1 -->
</template>
