import type { ThemeStoreContext } from '@/models/theme-store.model'
import type { PaletteShade, ThemeMode } from '@/models/foundations.model'
import type { UserTokens } from '@/models/user-tokens.model'
import { PALETTE_SHADES } from '@/models/foundations.model'
import { generatePalette } from '@/utils/palette-generator'
import { validateUserTokenName } from '@/utils/user-token-validation'
import { cloneTheme } from '@/utils/theme-store-helpers'
import type { UserTokenOperationResult as TokenResult } from '@/models/user-token-operation-result.model'

const hex = /^#[\da-f]{6}(?:[\da-f]{2})?$/i
const own = (record: object, name: string): boolean => Object.prototype.hasOwnProperty.call(record, name)

export function useThemeUserTokens({ theme, commit }: ThemeStoreContext) {
  const tokens = (): UserTokens => theme.value.foundations.userTokens ?? { palettes: {}, colors: {} }
  function create(name: string, value: string, palette: boolean): TokenResult {
    name = name.trim().toLowerCase()
    const error = validateUserTokenName(name)
    if (error) return { ok: false, error }
    if (own(tokens().colors, name) || own(tokens().palettes, name)) return { ok: false, error: 'That token name already exists.' }
    if (!hex.test(value)) return { ok: false, error: 'Use a six- or eight-digit hex seed.' }
    const candidate = cloneTheme(theme.value)
    candidate.foundations.userTokens ??= { palettes: {}, colors: {} }
    if (Object.keys(tokens().colors).length + Object.keys(tokens().palettes).length >= 64) return { ok: false, error: 'A theme supports at most 64 named tokens.' }
    if (palette) {
      const generated = generatePalette(value)
      const shades = Object.fromEntries(PALETTE_SHADES.map((shade) => [shade, { light: generated[shade] }])) as Record<PaletteShade, { light: string }>
      candidate.foundations.userTokens.palettes[name] = { base: { light: value.toLowerCase() }, shades }
    } else candidate.foundations.userTokens.colors[name] = { light: value.toLowerCase() }
    publish(candidate)
    return { ok: true, name }
  }
  function update(name: string, value: string, mode: ThemeMode, shade?: PaletteShade): TokenResult {
    if (!hex.test(value)) return { ok: false, error: 'Use a six- or eight-digit hex color.' }
    const candidate = cloneTheme(theme.value)
    const definitions = candidate.foundations.userTokens
    if (!definitions) return { ok: false, error: 'Token does not exist.' }
    const color = definitions.colors[name]
    const palette = definitions.palettes[name]
    if (color) color[mode] = value.toLowerCase()
    else if (palette && shade !== undefined) palette.shades[shade][mode] = value.toLowerCase()
    else if (palette) {
      palette.base[mode] = value.toLowerCase()
      const generated = generatePalette(value)
      for (const key of PALETTE_SHADES) palette.shades[key][mode] = generated[key]
    } else return { ok: false, error: 'Token does not exist.' }
    publish(candidate)
    return { ok: true }
  }
  function remove(name: string): TokenResult {
    const candidate = cloneTheme(theme.value)
    const definitions = candidate.foundations.userTokens
    if (!definitions || (!own(definitions.colors, name) && !own(definitions.palettes, name))) return { ok: false, error: 'Token does not exist.' }
    const prefix = own(definitions.colors, name) ? `user.color.${name}` : `user.palette.${name}.`
    const rest = cloneTheme(candidate)
    rest.foundations.userTokens = { palettes: {}, colors: {} }
    // References are complete string values, not substring matches against unrelated token names.
    const referenced = (value: unknown): boolean => typeof value === 'string' ? value === prefix || (prefix.endsWith('.') && value.startsWith(prefix)) : value !== null && typeof value === 'object' && Object.values(value).some(referenced)
    if (referenced(rest)) return { ok: false, error: 'This token is referenced. Replace those references before removing it.' }
    delete definitions.colors[name]; delete definitions.palettes[name]
    for (const [identity, link] of Object.entries(candidate.modeLinks ?? {})) if ((link.target && 'name' in link.target && link.target.name === name && link.target.kind.startsWith('user-')) || identity === `user.color.${name}`) delete candidate.modeLinks[identity]
    publish(candidate)
    return { ok: true }
  }
  function publish(candidate: typeof theme.value): void { if (commit) commit(candidate); else theme.value = candidate }
  return { userTokens: tokens, createUserColor: (name: string, value: string) => create(name, value, false), createUserPalette: (name: string, value: string) => create(name, value, true), updateUserToken: update, removeUserToken: remove }
}
