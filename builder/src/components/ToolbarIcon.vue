<script setup lang="ts">
import { faArrowRotateLeft, faArrowRotateRight, faFloppyDisk, faMagnifyingGlass, faMoon, faSun, faFileExport, faSliders } from '@fortawesome/free-solid-svg-icons'
const icons = { undo: faArrowRotateLeft, redo: faArrowRotateRight, save: faFloppyDisk, inspector: faMagnifyingGlass, moon: faMoon, sun: faSun, export: faFileExport, tools: faSliders }
defineProps<{ name: keyof typeof icons }>()
</script>

<template>
  <svg aria-hidden="true" focusable="false" width="14" height="14" :viewBox="`0 0 ${icons[name].icon[0]} ${icons[name].icon[1]}`" fill="currentColor" class="toolbar-icon">
    <path v-for="(path, index) in [icons[name].icon[4]].flat()" :key="index" :d="path" />
  </svg>
</template>
