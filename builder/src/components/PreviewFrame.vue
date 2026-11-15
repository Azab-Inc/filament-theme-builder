<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { PreviewFrameProps } from '@/models/preview-frame.model'
import { useEditorResizer } from '@/composables/use-editor-resizer'

const props = defineProps<PreviewFrameProps>()
const workspace = ref<HTMLElement | null>(null)
const resize = useEditorResizer(workspace)
const workspaceStyle = computed(() => resize.editorWidth.value === null ? undefined : { '--editor-pane-width': `${resize.editorWidth.value}px` })

function setIframeRef(element: Element | ComponentPublicInstance | null): void {
  props.setIframe(element instanceof HTMLIFrameElement ? element : null)
}
</script>

<template>
  <div ref="workspace" class="editor-workspace" data-editor-workspace :style="workspaceStyle">
    <slot />
    <button
      type="button"
      role="separator"
      class="editor-resize-handle"
      aria-label="Resize editor and preview"
      aria-orientation="vertical"
      :aria-valuemin="resize.editorMinimum"
      :aria-valuemax="resize.maximum.value"
      :aria-valuenow="Math.round(resize.currentWidth.value)"
      :aria-valuetext="`${Math.round(resize.currentWidth.value)} pixels editor width`"
      :class="{ 'is-dragging': resize.dragging.value }"
      @pointerdown="resize.startDragging"
      @keydown="resize.onKeydown"
    ><span aria-hidden="true" /></button>
    <iframe
      :ref="setIframeRef"
      :src="iframeSrc"
      title="Filament preview"
      data-editor-iframe
      class="preview-shell__frame"
      @load="onPreviewLoad"
    />
  </div>
</template>
