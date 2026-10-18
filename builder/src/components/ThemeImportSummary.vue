<script setup lang="ts">
import type { ImportPreview } from '@/models/theme-import.model'

defineProps<{ preview: ImportPreview; filename: string }>()
</script>

<template>
  <section aria-label="Import summary" class="my-4 rounded border border-slate-300 p-3 text-sm">
    <p><strong>File:</strong> {{ filename }}</p>
    <p><strong>Schema:</strong> {{ preview.sourceVersion }} → {{ preview.targetVersion }}</p>
    <p><strong>Migration:</strong> {{ preview.migrationPath.join(' → ') }}</p>
    <p><strong>SHA-256:</strong> <code class="break-all">{{ preview.payloadDigest }}</code></p>
    <p><strong>Size:</strong> {{ preview.byteLength }} bytes</p>
    <ul aria-label="Affected theme areas"><li v-for="item in preview.summary" :key="item">{{ item }}</li></ul>
  </section>
</template>
