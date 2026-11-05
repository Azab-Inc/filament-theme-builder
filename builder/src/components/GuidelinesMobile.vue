<script setup lang="ts">
import { ref } from 'vue'
import GuidelinesSampleDashboard from '@/components/GuidelinesSampleDashboard.vue'

const workspace = ref<'edit' | 'preview'>('edit')
const name = ref('Northstar admin')
</script>

<template>
  <section class="gp-shell gp-mobile"><header><b>Theme builder</b><span>Responsive workspace direction</span></header>
    <div class="gp-workspace-tabs"><button :aria-pressed="workspace === 'edit'" aria-label="Edit workspace" @click="workspace = 'edit'">Edit</button><button :aria-pressed="workspace === 'preview'" aria-label="Preview workspace" @click="workspace = 'preview'">Preview</button></div>
    <article v-if="workspace === 'edit'"><h1>Mobile workspaces</h1><p>At 390px, one full-width workspace keeps controls comfortable and visible.</p><label>Theme name<input v-model="name" /></label><button class="gp-primary" @click="workspace = 'preview'">Preview theme</button></article>
    <article v-else class="gp-preview"><h1>{{ name }}</h1><p>Read-only visual context · edits remain in memory.</p><GuidelinesSampleDashboard :theme-name="name" /><button @click="workspace = 'edit'">Back to edit</button></article>
    <footer>Safe-area-aware controls · no horizontal overflow</footer>
  </section>
</template>
