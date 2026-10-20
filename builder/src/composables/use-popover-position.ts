import { nextTick, onUnmounted, watch, type Ref } from 'vue'

export function usePopoverPosition(open: Ref<boolean>, trigger: Ref<HTMLElement | null>, panel: Ref<HTMLElement | null>, position: Ref<{ top: number; left: number }>) {
  let active = false
  const update = () => {
    const anchor = trigger.value?.getBoundingClientRect()
    const popup = panel.value
    if (!anchor || !popup) return
    const width = Math.min(390, window.innerWidth - 16)
    const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8))
    const below = anchor.bottom + 8
    const top = below + popup.offsetHeight <= window.innerHeight - 8 ? below : Math.max(8, anchor.top - popup.offsetHeight - 8)
    position.value = { top, left }
  }
  const listen = () => { update(); window.addEventListener('resize', update); window.addEventListener('scroll', update, true); active = true }
  const unlisten = () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); active = false }
  watch(open, async (isOpen) => {
    if (!isOpen) return unlisten()
    await nextTick()
    if (!open.value) return
    if (!active) listen()
  }, { flush: 'post' })
  onUnmounted(unlisten)
}
