<script setup lang="ts">
import { reactive } from 'vue'
import type { BuilderShellModel } from '@/models/builder-shell.model'

const props = defineProps<{ shell: BuilderShellModel }>()
const shell = reactive(props.shell)
</script>

<template>
  <fieldset class="editor-navigation-toggle" data-editor-navigation>
    <legend>Editor navigation</legend>
    <label><input type="radio" role="radio" aria-label="Sidebar" name="editor-navigation" value="sidebar" :checked="shell.editorNavigationMode === 'sidebar'" :aria-checked="shell.editorNavigationMode === 'sidebar'" @change="shell.editorNavigationMode = 'sidebar'" /><span>Sidebar</span></label>
    <label><input type="radio" role="radio" aria-label="Top navigation" name="editor-navigation" value="top" :checked="shell.editorNavigationMode === 'top'" :aria-checked="shell.editorNavigationMode === 'top'" @change="shell.editorNavigationMode = 'top'" /><span>Top navigation</span></label>
  </fieldset>
  <nav v-if="shell.editorNavigationMode === 'sidebar'" class="editor-nav-rail" data-editor-nav-rail aria-label="Editor sections" role="tablist" aria-orientation="vertical">
    <button v-for="section in shell.editorSections" :id="`editor-tab-${section.id}`" :key="section.id" type="button" role="tab" :aria-selected="shell.selectedEditorSection === section.id" :aria-controls="`editor-panel-${section.id}`" :data-editor-section-button="section.id" :data-editor-section-tab="section.id" @click="shell.selectEditorSection(section.id)" @keydown="shell.handleEditorTabKeydown($event, section.id)">{{ section.label }}</button>
    <button v-if="shell.inspector.selectedInspectorEvidence" type="button" role="tab" id="editor-tab-inspector" :aria-selected="shell.selectedEditorSection === 'inspector'" aria-controls="editor-panel-inspector" data-editor-section-button="inspector" data-editor-section-tab="inspector" @click="shell.selectEditorSection('inspector')" @keydown="shell.handleEditorTabKeydown($event, 'inspector')">Inspector</button>
  </nav>
  <nav v-else class="editor-tabs" data-editor-tabs aria-label="Editor sections" role="tablist">
    <button v-for="section in shell.editorSections" :id="`editor-tab-${section.id}`" :key="section.id" type="button" role="tab" :aria-selected="shell.selectedEditorSection === section.id" :aria-controls="`editor-panel-${section.id}`" :data-editor-section-tab="section.id" @click="shell.selectEditorSection(section.id)" @keydown="shell.handleEditorTabKeydown($event, section.id)">{{ section.label }}</button>
    <button v-if="shell.inspector.selectedInspectorEvidence" type="button" role="tab" id="editor-tab-inspector" :aria-selected="shell.selectedEditorSection === 'inspector'" aria-controls="editor-panel-inspector" data-editor-section-tab="inspector" @click="shell.selectEditorSection('inspector')" @keydown="shell.handleEditorTabKeydown($event, 'inspector')">Inspector</button>
  </nav>
</template>
