export function clampEditorWidth(width: number, workspaceWidth: number, editorMinimum: number, previewMinimum: number): number {
  const maximum = Math.max(editorMinimum, workspaceWidth - previewMinimum)
  return Math.min(Math.max(width, editorMinimum), maximum)
}

export function resizeEditorWidth(initialWidth: number, delta: number, workspaceWidth: number, editorMinimum: number, previewMinimum: number): number {
  return clampEditorWidth(initialWidth + delta, workspaceWidth, editorMinimum, previewMinimum)
}
