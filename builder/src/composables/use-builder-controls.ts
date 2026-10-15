import type { BuilderState } from './use-builder-state'
import type { EditorSection } from '@/models/editor.model'

export function useBuilderControls(state: BuilderState) {
  function setSelectFoundation(path: string, event: Event): void { state.theme.setFoundation(path, (event.target as HTMLSelectElement).value) }
  function setNumberFoundation(path: string, event: Event): void { state.theme.setFoundation(path, Number((event.target as HTMLInputElement).value)) }
  function setFontName(name: 'body' | 'heading' | 'mono', event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim()
    if (value) state.theme.setFoundation(`typography.${name}`, { kind: 'custom', name: value, family: value })
  }
  function setFontChoice(name: 'body' | 'heading' | 'mono', event: Event): void {
    const choice = state.fontChoices.find((font) => font.value === (event.target as HTMLSelectElement).value)
    if (choice?.font) state.theme.setFoundation(`typography.${name}`, choice.font)
  }
  function handleEditorTabKeydown(event: KeyboardEvent, section: string): void {
    const nextKey = state.editorNavigationMode.value === 'sidebar' ? 'ArrowDown' : 'ArrowRight'
    const previousKey = state.editorNavigationMode.value === 'sidebar' ? 'ArrowUp' : 'ArrowLeft'
    if (![nextKey, previousKey, 'Home', 'End'].includes(event.key)) return
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-editor-section-tab]'))
    const current = tabs.findIndex((tab) => tab.dataset.editorSectionTab === section)
    if (current < 0) return
    event.preventDefault()
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === nextKey ? 1 : -1) + tabs.length) % tabs.length
    const next = tabs[index]
    if (next) { state.selectedEditorSection.value = next.dataset.editorSectionTab as EditorSection; next.focus() }
  }
  function selectEditorSection(section: EditorSection): void {
    if (section === 'inspector' && !state.inspector.selectedInspectorEvidence.value) return
    state.selectedEditorSection.value = section
  }
  function undo(): void { state.theme.undo() }
  function redo(): void { state.theme.redo() }
  return { setSelectFoundation, setNumberFoundation, setFontName, setFontChoice, handleEditorTabKeydown, selectEditorSection, undo, redo }
}
