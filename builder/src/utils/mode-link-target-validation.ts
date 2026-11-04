import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import { validateRawSelector } from '@/utils/raw-override-validation'
import { validateResolveRequest } from '@/utils/resolve-request-validation'
import { KNOWN_EXPLICIT_PATHS } from '@/utils/foundation-validation-constants.util'

const rawProperties = ['color', 'background-color', 'border-color', 'border-width', 'border-radius', 'box-shadow', 'opacity', 'padding', 'margin', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-decoration', 'border-style', 'text-align', 'white-space']

export function validModeLinkTarget(target: ModeLinkTarget, registry: FilamentRegistry): boolean {
  if (!target || typeof target !== 'object') return false
  if (target.kind === 'raw') return keys(target, ['kind', 'selector', 'property']) && validateRawSelector(target.selector).valid && rawProperties.includes(target.property)
  if (target.kind === 'semantic') return keys(target, ['kind', 'targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId']) && ['global', 'component', 'variant', 'state'].includes(target.scope) && validateResolveRequest({ targetId: target.targetId, controlId: target.controlId, ...(target.componentId ? { componentId: target.componentId } : {}), ...(target.variantId ? { variantId: target.variantId } : {}), ...(target.stateId ? { stateId: target.stateId } : {}) }, registry).valid
  if (target.kind === 'foundation') return keys(target, ['kind', 'path']) && /^(surfaces|borders|text)\.[a-z-]+$/.test(target.path) && KNOWN_EXPLICIT_PATHS.has(`${target.path}.light`)
  if (target.kind === 'palette-base' || target.kind === 'palette-shade') return keys(target, target.kind === 'palette-base' ? ['kind', 'name'] : ['kind', 'name', 'shade']) && (PALETTE_NAMES as readonly string[]).includes(target.name) && (target.kind !== 'palette-shade' || PALETTE_SHADES.includes(target.shade))
  if (target.kind === 'user-color' || target.kind === 'user-palette-base' || target.kind === 'user-palette-shade') return keys(target, target.kind === 'user-palette-shade' ? ['kind', 'name', 'shade'] : ['kind', 'name']) && /^[a-z][a-z0-9-]{0,31}$/.test(target.name) && (target.kind !== 'user-palette-shade' || PALETTE_SHADES.includes(target.shade))
  return false
}

function keys(value: object, allowed: string[]): boolean { return Object.keys(value).every((key) => allowed.includes(key)) }
