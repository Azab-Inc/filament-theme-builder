import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ResolveRequest } from '@/models/theme.model'
import type { ResolveRequestValidationResult } from '@/models/resolve-request-validation-result.model'
import { isObject, nonEmptyString, validOptionalIdentifiers } from '@/utils/theme-validation-helpers'

export function validateResolveRequest(request: unknown, registry: FilamentRegistry): ResolveRequestValidationResult {
  const targetId = isObject(request) && typeof request.targetId === 'string' ? request.targetId : ''
  const controlId = isObject(request) && typeof request.controlId === 'string' ? request.controlId : ''
  if (!isObject(request) || Array.isArray(request)) return { valid: false, targetId, controlId, error: 'Invalid resolve request' }
  const allowedKeys = new Set(['targetId', 'controlId', 'componentId', 'variantId', 'stateId'])
  if (Reflect.ownKeys(request).some((key) => typeof key !== 'string' || !allowedKeys.has(key))) return { valid: false, targetId, controlId, error: 'Invalid resolve request: unsupported key' }
  if (!nonEmptyString(targetId) || !nonEmptyString(controlId) || !validOptionalIdentifiers(request)) return { valid: false, targetId, controlId, error: 'Invalid resolve request identifiers' }
  const entry = registry.entries.find(({ id }) => id === targetId)
  if (!entry) return { valid: false, targetId, controlId, error: `Unknown target: ${targetId}` }
  if (!entry.controls.some(({ id }) => id === controlId)) return { valid: false, targetId, controlId, error: `Unknown control: ${controlId}` }
  const hasComponent = request.componentId !== undefined
  const hasVariant = request.variantId !== undefined
  const hasState = request.stateId !== undefined
  const componentId = request.componentId as string | undefined
  const variantId = request.variantId as string | undefined
  const stateId = request.stateId as string | undefined
  if (hasVariant && !hasComponent || hasState && !hasVariant) return { valid: false, targetId, controlId, error: 'Invalid resolve request scope hierarchy' }
  if (hasComponent && componentId !== entry.family) return { valid: false, targetId, controlId, error: `Unknown component: ${componentId}` }
  if (hasVariant && !entry.variants.includes(variantId!)) return { valid: false, targetId, controlId, error: `Unsupported variant: ${variantId}` }
  if (hasState && !entry.states.includes(stateId!)) return { valid: false, targetId, controlId, error: `Unsupported state: ${stateId}` }
  return { valid: true, request: request as ResolveRequest }
}
