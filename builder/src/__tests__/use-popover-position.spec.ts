import { createApp, defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePopoverPosition } from '@/composables/use-popover-position'

let cleanup: (() => void) | undefined
let currentPosition: Ref<{ top: number; left: number }>
let currentPanel: Ref<HTMLElement | null>
const originalWidth = window.innerWidth
const originalHeight = window.innerHeight
function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect
}
function mountPositioner() {
  let setOpen!: (value: boolean) => void
  const app = createApp(defineComponent({ setup() {
    const open = ref(true), trigger = ref<HTMLElement | null>(null), panel = ref<HTMLElement | null>(null)
    currentPanel = panel
    const position = ref({ top: 8, left: 8 })
    currentPosition = position
    setOpen = (value) => { open.value = value }
    usePopoverPosition(open, trigger, panel, position)
    return () => h('section', [h('button', { ref: trigger }), h('div', { ref: panel, style: { top: `${position.value.top}px`, left: `${position.value.left}px` } })])
  } }))
  const host = document.createElement('div')
  document.body.append(host)
  app.mount(host)
  const trigger = host.querySelector('button')!
  const panel = host.querySelector('section > div')!
  Object.defineProperty(trigger, 'getBoundingClientRect', { configurable: true, value: () => rect(700, 500, 40, 20) })
  Object.defineProperty(panel, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 0, 390, 180) })
  cleanup = () => { app.unmount(); host.remove() }
  return { host, trigger, setOpen }
}
afterEach(() => {
  cleanup?.(); cleanup = undefined
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight })
  vi.restoreAllMocks()
})

describe('usePopoverPosition', () => {
  it('clamps right and bottom bounds and tracks resize and scroll while open', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
    const { host, trigger } = mountPositioner()
    await nextTick(); await nextTick()
    expect(window.innerHeight).toBe(600)
    expect(currentPanel.value?.getBoundingClientRect().height).toBe(180)
    expect(currentPosition.value).toEqual({ left: 402, top: 312 })
    expect(currentPosition.value.left + 390).toBeLessThanOrEqual(window.innerWidth - 8)
    expect(currentPosition.value.top + 180).toBeLessThanOrEqual(window.innerHeight - 8)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 300 })
    window.dispatchEvent(new Event('resize'))
    expect(currentPosition.value.left).toBe(8)
    Object.defineProperty(trigger, 'getBoundingClientRect', { configurable: true, value: () => rect(10, 10, 40, 20) })
    window.dispatchEvent(new Event('scroll'))
    expect(currentPosition.value).toEqual({ left: 8, top: 38 })
    expect(currentPosition.value.left + 284).toBeLessThanOrEqual(window.innerWidth - 8)
  })

  it('attaches listeners when initially open, removes them on close and unmount', async () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')
    const { setOpen } = mountPositioner()
    await nextTick(); await nextTick()
    expect(added.mock.calls.some(([name]) => name === 'resize')).toBe(true)
    expect(added.mock.calls.some(([name]) => name === 'scroll')).toBe(true)
    setOpen(false)
    await nextTick()
    expect(removed.mock.calls.some(([name]) => name === 'resize')).toBe(true)
    expect(removed.mock.calls.some(([name]) => name === 'scroll')).toBe(true)
    setOpen(true)
    await nextTick(); await nextTick()
    cleanup?.()
    cleanup = undefined
    expect(removed.mock.calls.filter(([name]) => name === 'resize').length).toBeGreaterThan(1)
    expect(removed.mock.calls.filter(([name]) => name === 'scroll').length).toBeGreaterThan(1)
  })
})
