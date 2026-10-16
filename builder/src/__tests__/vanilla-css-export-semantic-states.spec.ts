import { describe, expect, it } from 'vitest'

import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { exportVanillaCss } from '@/utils/vanilla-css-export'

describe('vanilla CSS semantic states', () => {
  it.each([
    { targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId: 'primary', stateId: 'hover', selector: '.fi-btn.fi-color-primary:hover' },
    { targetId: 'form.product-name', controlId: 'background', componentId: 'form', variantId: 'default', stateId: 'focus', selector: '.fi-fo-text-input .fi-input:focus' },
  ] as const)(
    'preserves the registered $stateId pseudo-state without rewriting it',
    ({ targetId, controlId, componentId, variantId, stateId, selector }) => {
      const theme = createDefaultThemeState()
      theme.overrides = [{
        targetId,
        controlId,
        scope: 'state',
        componentId,
        variantId,
        stateId,
        value: '#111111',
      }]

      const { css } = exportVanillaCss(theme)

      expect(css).toContain(`${selector} { background-color: #111111 !important; }`)
    },
  )

  it('rejects an unsupported semantic state instead of transforming it', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [{
      targetId: 'button.primary',
      controlId: 'background',
      scope: 'state',
      componentId: 'button',
      variantId: 'primary',
      stateId: 'focus',
      value: '#111111',
    }]

    expect(exportVanillaCss(theme).errors).toContainEqual(expect.stringMatching(/Unsupported semantic override state/i))
  })

  it('rejects an unsupported semantic override instead of silently omitting it', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [{
      targetId: 'button.primary',
      controlId: 'unsupported',
      scope: 'global',
      value: '#0f766e',
    }]

    expect(exportVanillaCss(theme).errors).toContainEqual(expect.stringMatching(/Unsupported semantic override/i))
  })
})
