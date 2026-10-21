import { mount } from '@vue/test-utils'
import FoundationsPaletteControls from '@/components/FoundationsPaletteControls.vue'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'

export function mountPaletteControls() {
  return mount(FoundationsPaletteControls, { attachTo: document.body, props: {
    palettes: createDefaultFoundationState().palettes,
    paletteNames: PALETTE_NAMES, paletteShades: PALETTE_SHADES,
    statusFor: path => path === 'palettes.primary.base' ? 'explicit' : 'generated',
  } })
}
