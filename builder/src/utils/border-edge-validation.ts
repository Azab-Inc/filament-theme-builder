import type { BorderEdgeOverride } from '@/models/border-edge.model'
import { BORDER_EDGES, BORDER_PROPERTIES, BORDER_STYLES } from '@/models/border-edge.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import { isSafePropertyValue } from '@/utils/raw-override-property-validation'
import { borderTargetMetadata } from '@/registry/border-target-catalog'

export function validateBorderEdges(value: unknown, registry: FilamentRegistry): { valid: true } | { valid: false; message: string } {
  if (!Array.isArray(value)) return { valid: false, message: 'Border edges must be an array' }
  const identities = new Set<string>()
  for (const [index, candidate] of value.entries()) {
    const result = validateBorderEdge(candidate, registry)
    if (!result.valid) return { valid: false, message: `borderEdges[${index}]: ${result.message}` }
    const identity = borderEdgeIdentity(result.value)
    if (identities.has(identity)) return { valid: false, message: `Duplicate border edge identity: ${identity}` }
    identities.add(identity)
  }
  return { valid: true }
}
export function validateBorderEdge(value: unknown, registry: FilamentRegistry): { valid: true; value: BorderEdgeOverride } | { valid: false; message: string } {
  if (!isRecord(value) || value.controlId !== 'border' || typeof value.targetId !== 'string' || typeof value.edge !== 'string' || typeof value.property !== 'string' || typeof value.scope !== 'string') return { valid: false, message: 'Border edge identity is invalid' }
  if (!BORDER_EDGES.includes(value.edge as never) || !BORDER_PROPERTIES.includes(value.property as never)) return { valid: false, message: 'Border edge or property is unsupported' }
  if (!['global', 'component', 'variant', 'state'].includes(value.scope)) return { valid: false, message: 'Border scope is invalid' }
   const metadata = borderTargetMetadata(value.targetId)
   if (!metadata) return { valid: false, message: 'Border target is not a verified border target' }
   if (value.scope === 'component' && !metadata.componentSelectors?.[String(value.componentId)]) return { valid: false, message: 'Border component scope is not verified' }
   if (value.scope === 'variant' && !metadata.variantSelectors?.[String(value.variantId)]) return { valid: false, message: 'Border variant scope is not verified' }
   if (value.scope === 'state' && !metadata.stateSelectors?.[String(value.stateId)]) return { valid: false, message: 'Border state scope is not verified' }
  if (value.value === undefined && value.darkValue === undefined) return { valid: false, message: 'Border edge requires a value' }
  for (const candidate of [value.value, value.darkValue]) if (candidate !== undefined && !validPropertyValue(value.property, candidate)) return { valid: false, message: `Invalid border ${value.property}` }
  return { valid: true, value: value as BorderEdgeOverride }
}
export function borderEdgeIdentity(value: BorderEdgeOverride): string { return [value.targetId, value.controlId, value.edge, value.property, value.scope, value.componentId ?? '', value.variantId ?? '', value.stateId ?? ''].join('\u0000') }
function validPropertyValue(property: string, value: unknown): boolean {
  if (property === 'width') return typeof value === 'number' && Number.isFinite(value) && value >= 0
  if (property === 'style') return typeof value === 'string' && BORDER_STYLES.includes(value as never)
  return typeof value === 'string' && isSafePropertyValue('border-color', value)
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
