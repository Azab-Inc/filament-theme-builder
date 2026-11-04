import type { PaletteShade, ThemeMode } from '@/models/foundations.model'

export const USER_TOKEN_NAME_PATTERN = /^[a-z][a-z0-9-]{0,31}$/
export const USER_TOKEN_RESERVED_NAMES = new Set(['primary', 'success', 'warning', 'danger', 'info', 'gray'])

export type UserModeValue<T> = { light: T; dark?: T }
export type UserPalette = { base: UserModeValue<string>; shades: Record<PaletteShade, UserModeValue<string>> }
export type UserTokens = { palettes: Record<string, UserPalette>; colors: Record<string, UserModeValue<string>> }
export type UserTokenReference = `user.palette.${string}.${PaletteShade}` | `user.color.${string}`
export type ColorValue = string | UserTokenReference
export type UserTokenMode = ThemeMode
