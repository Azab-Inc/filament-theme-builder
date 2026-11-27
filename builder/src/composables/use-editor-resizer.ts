import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { clampEditorWidth, resizeEditorWidth } from '@/utils/editor-resize'

const EDITOR_MINIMUM = 280
const PREVIEW_MINIMUM = 280
const HANDLE_WIDTH = 12

export function useEditorResizer(workspace: Ref<HTMLElement | null>) {
  const editorWidth = ref<number | null>(null)
  const workspaceWidth = ref(0)
  const dragging = ref(false)
  let startX = 0
  let startWidth = 0
  let observer: ResizeObserver | undefined

  const maximum = computed(() => Math.max(EDITOR_MINIMUM, workspaceWidth.value - HANDLE_WIDTH - PREVIEW_MINIMUM))
  const currentWidth = computed(() => editorWidth.value ?? workspace.value?.querySelector<HTMLElement>('[data-editor-panel]')?.getBoundingClientRect().width ?? EDITOR_MINIMUM)

  function measure(): void {
    const element = workspace.value
    if (!element) return
    workspaceWidth.value = element.clientWidth
    if (editorWidth.value !== null) {
      editorWidth.value = clampEditorWidth(currentWidth.value, workspaceWidth.value - HANDLE_WIDTH, EDITOR_MINIMUM, PREVIEW_MINIMUM)
    }
  }

  function setWidth(width: number): void {
    editorWidth.value = clampEditorWidth(width, workspaceWidth.value - HANDLE_WIDTH, EDITOR_MINIMUM, PREVIEW_MINIMUM)
  }

  function onPointerMove(event: PointerEvent): void {
    if (dragging.value) setWidth(resizeEditorWidth(startWidth, event.clientX - startX, workspaceWidth.value - HANDLE_WIDTH, EDITOR_MINIMUM, PREVIEW_MINIMUM))
  }

  function stopDragging(): void {
    dragging.value = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', stopDragging)
    window.removeEventListener('pointercancel', stopDragging)
  }

  function startDragging(event: PointerEvent): void {
    event.preventDefault()
    startX = event.clientX
    startWidth = currentWidth.value
    dragging.value = true
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  }

  function onKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 100 : 20
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      setWidth(currentWidth.value + (event.key === 'ArrowRight' ? step : -step))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setWidth(event.key === 'Home' ? EDITOR_MINIMUM : maximum.value)
    }
  }

  onMounted(() => {
    measure()
    observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(workspace.value as Element)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    stopDragging()
  })

  return { editorWidth, maximum, currentWidth, dragging, startDragging, onKeydown, editorMinimum: EDITOR_MINIMUM, previewMinimum: PREVIEW_MINIMUM }
}
