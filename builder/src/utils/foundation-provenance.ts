import type { FoundationState, PaletteName, PaletteShade, ThemeMode } from '@/models/foundations.model'

export function markExplicitPath(state: FoundationState, path: string): void {
  if (!state.explicitPaths.includes(path)) state.explicitPaths.push(path)
}

export function clearExplicitPath(state: FoundationState, path: string): void {
  state.explicitPaths = state.explicitPaths.filter((candidate) => candidate !== path)
}

export function isExplicitPath(state: { readonly explicitPaths: readonly string[] }, path: string): boolean {
  return state.explicitPaths.includes(path)
}

export function isModeInherited(state: { readonly explicitPaths: readonly string[] }, collection: string, name: string, mode: ThemeMode): boolean {
  return mode === 'dark' && !isExplicitPath(state, `${collection}.${name}.dark`) && isExplicitPath(state, `${collection}.${name}.light`)
}

export function resolveModeValue<T>(state: { readonly explicitPaths: readonly string[] }, values: { light: T; dark: T }, collection: string, name: string, mode: ThemeMode): T {
  return isModeInherited(state, collection, name, mode) ? values.light : values[mode]
}

export function isPaletteExplicit(state: { readonly explicitPaths: readonly string[] }, name: PaletteName): boolean {
  return state.explicitPaths.some((path) => path === `palettes.${name}.base` || path.startsWith(`palettes.${name}.overrides.`))
}

export function paletteOverridePath(name: PaletteName, shade: PaletteShade): string {
  return `palettes.${name}.overrides.${shade}`
}
