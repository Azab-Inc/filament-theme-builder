<script setup lang="ts">
const previewUrl = import.meta.env.VITE_DEMO_URL ?? '/demo/admin'
</script>

<template>
  <main class="preview-shell">
    <header class="preview-shell__header">
      <h1>Filament Theme Builder</h1>
      <p data-demo-notice>Preview demo data is temporary.</p>
    </header>
    <iframe :src="previewUrl" title="Filament preview" class="preview-shell__frame" />
  </main>
</template>

<style scoped>
.preview-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.preview-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
}

.preview-shell__header h1 {
  margin: 0;
  font-size: 1rem;
}

.preview-shell__header p {
  margin: 0;
  color: #71717a;
  font-size: 0.75rem;
}

.preview-shell__frame {
  width: 100%;
  flex: 1;
  border: 0;
}
</style>
