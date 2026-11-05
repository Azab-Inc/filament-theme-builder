<script setup lang="ts">
import type { BuilderShellModel } from '@/models/builder-shell.model'
import EditorNavigation from './EditorNavigation.vue'
import EditorSections from './EditorSections.vue'

const props = defineProps<{ shell: BuilderShellModel }>()
</script>

<template>
  <section id="builder-editor-panel" class="editor-panel" data-editor-panel aria-label="Editor panel" tabindex="-1">
    <EditorNavigation :shell="props.shell" />
    <div class="editor-content" data-editor-content><EditorSections :shell="props.shell" /></div>
  </section>
</template>
