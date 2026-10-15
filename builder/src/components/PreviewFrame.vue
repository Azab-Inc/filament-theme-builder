<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { PreviewFrameProps } from '@/models/preview-frame.model'

const props = defineProps<PreviewFrameProps>()

function setIframeRef(element: Element | ComponentPublicInstance | null): void {
  props.setIframe(element instanceof HTMLIFrameElement ? element : null)
}
</script>

<template>
  <div class="editor-workspace" data-editor-workspace>
    <slot />
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
