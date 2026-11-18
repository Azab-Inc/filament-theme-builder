import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import { validateRawSelector } from '@/utils/raw-override-validation'
import { validateResolveRequest } from '@/utils/resolve-request-validation'
import { KNOWN_EXPLICIT_PATHS } from '@/utils/foundation-validation-constants.util'
import { BORDER_EDGES, BORDER_PROPERTIES } from '@/models/border-edge.model'
import { borderTargetMetadata } from '@/registry/border-target-catalog'
import { ALL_RAW_VISUAL_PROPERTIES } from '@/models/raw-overrides.model'

export function validModeLinkTarget(target: ModeLinkTarget, registry: FilamentRegistry): boolean {
  if (!target || typeof target !== 'object') return false
  if (target.kind === 'raw') return keys(target, ['kind', 'selector', 'property']) && validateRawSelector(target.selector).valid && ALL_RAW_VISUAL_PROPERTIES.includes(target.property)
  if (target.kind === 'semantic') return keys(target, ['kind', 'targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId']) && ['global', 'component', 'variant', 'state'].includes(target.scope) && validateResolveRequest({ targetId: target.targetId, controlId: target.controlId, ...(target.componentId ? { componentId: target.componentId } : {}), ...(target.variantId ? { variantId: target.variantId } : {}), ...(target.stateId ? { stateId: target.stateId } : {}) }, registry).valid
   if (target.kind === 'semantic-border') {
    const metadata = borderTargetMetadata(target.targetId)
    const scoped = target.scope === 'global' || (target.scope === 'component' && Boolean(metadata?.componentSelectors?.[String(target.componentId)])) || (target.scope === 'variant' && Boolean(metadata?.variantSelectors?.[String(target.variantId)])) || (target.scope === 'state' && Boolean(metadata?.stateSelectors?.[String(target.stateId)]))
    return keys(target, ['kind', 'targetId', 'edge', 'property', 'scope', 'componentId', 'variantId', 'stateId']) && Boolean(metadata) && scoped && BORDER_EDGES.includes(target.edge) && BORDER_PROPERTIES.includes(target.property) && ['global', 'component', 'variant', 'state'].includes(target.scope)
   }
  if (target.kind === 'foundation') return keys(target, ['kind', 'path']) && /^(surfaces|borders|text)\.[a-z-]+$/.test(target.path) && KNOWN_EXPLICIT_PATHS.has(`${target.path}.light`)
  if (target.kind === 'palette-base' || target.kind === 'palette-shade') return keys(target, target.kind === 'palette-base' ? ['kind', 'name'] : ['kind', 'name', 'shade']) && (PALETTE_NAMES as readonly string[]).includes(target.name) && (target.kind !== 'palette-shade' || PALETTE_SHADES.includes(target.shade))
  if (target.kind === 'user-color' || target.kind === 'user-palette-base' || target.kind === 'user-palette-shade') return keys(target, target.kind === 'user-palette-shade' ? ['kind', 'name', 'shade'] : ['kind', 'name']) && /^[a-z][a-z0-9-]{0,31}$/.test(target.name) && (target.kind !== 'user-palette-shade' || PALETTE_SHADES.includes(target.shade))
  return false
}

function keys(value: object, allowed: string[]): boolean { return Object.keys(value).every((key) => allowed.includes(key)) }
