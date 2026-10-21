import type { FoundationsSurfaceControlsProps } from '@/dtos/foundations-surface-controls-props.dto'
import type { SemanticComponentRow } from '@/models/semantic-component-row.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'

export function modeColorProps(): FoundationsSurfaceControlsProps {
  const defaults = createDefaultFoundationState()
  return {
    activeMode: 'light',
    surfaces: { page: defaults.surfaces.page.light, sidebar: '#ffffff', topbar: '#ffffff', card: '#ffffff', elevated: '#ffffff', input: '#ffffff' },
    borders: { default: defaults.borders.default.light, strong: defaults.borders.strong.light },
    text: { primary: defaults.text.primary.light, muted: defaults.text.muted.light, disabled: defaults.text.disabled.light },
    surfaceNames: ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'],
    borderNames: ['default', 'strong'], textNames: ['primary', 'muted', 'disabled'],
    statusFor: () => 'inherited', foundationError: () => undefined,
  }
}

export function componentColorRows(): SemanticComponentRow[] {
  return (['global', 'component', 'variant', 'state'] as const).map(scope => ({
    scope, label: scope, value: '#ffffff', source: 'global', explicit: false,
    request: { targetId: 'form.product-name', controlId: 'background', componentId: 'form', variantId: 'default', stateId: 'focus' },
  }))
}
