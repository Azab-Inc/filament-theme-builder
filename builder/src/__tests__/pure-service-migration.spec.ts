import * as foundationDefaults from '@/utils/foundation-defaults'
import * as foundationRecovery from '@/utils/foundation-recovery'
import * as foundationProjection from '@/utils/foundation-projection'
import * as foundationProvenance from '@/utils/foundation-provenance'
import * as foundationValidation from '@/utils/foundation-validation'
import * as iconExport from '@/utils/icon-export'
import * as inspectorProtocol from '@/utils/inspector-protocol'
import * as paletteGenerator from '@/utils/palette-generator'
import * as panelBrandingExport from '@/utils/panel-branding-export'
import * as panelBrandingValidation from '@/utils/panel-branding-validation'
import * as rawOverrideValidation from '@/utils/raw-override-validation'
import * as themeResolver from '@/utils/theme-resolver'
import * as themeSerialization from '@/utils/theme-serialization'
import * as themeValidation from '@/utils/theme-validation'
import * as vanillaCssExport from '@/utils/vanilla-css-export'
import { describe, expect, it } from 'vitest'

const migratedRuntimeExports = {
  foundationDefaults: ['createDefaultFoundationState', 'createDefaultThemeState', 'densityPreset'],
  foundationRecovery: ['legacyRecoveryError', 'restoreLegacyTheme'],
  foundationProjection: ['projectFoundations'],
  foundationProvenance: ['markExplicitPath', 'clearExplicitPath', 'isExplicitPath', 'isPaletteExplicit', 'paletteOverridePath'],
  foundationValidation: ['validateFoundationState', 'validateFoundationMapping', 'isEditableFoundationPath', 'validateFoundationColor'],
  iconExport: ['exportIconConfigurationPhp'],
  inspectorProtocol: ['INSPECTOR_PROTOCOL_VERSION', 'isInspectorCommand', 'isInspectorEvent', 'isInspectorTargetEvidence', 'resolveInspectorTarget'],
  paletteGenerator: ['generatePalette', 'applyPaletteOverrides', 'resetPaletteShade'],
  panelBrandingExport: ['exportPanelBrandingJson', 'exportPanelProviderBrandingPhp'],
  panelBrandingValidation: ['createDefaultPanelBrandingSettings', 'validatePanelBrandingSettings', 'classifyPanelBrandingSetting'],
  rawOverrideValidation: ['ALL_RAW_VISUAL_PROPERTIES', 'validateRawSelector', 'classifyRawSelector', 'proposeRawSelector', 'validateRawElementOverride', 'validateRawOverrides'],
  themeResolver: ['resolveThemeValue'],
  themeSerialization: ['serializeCanonicalTheme', 'serializeTheme', 'deserializeTheme'],
  themeValidation: ['validateThemeOverride', 'validateThemeState', 'validateResolveRequest'],
  vanillaCssExport: ['exportVanillaCss'],
} as const

describe('pure service migration', () => {
  it('preserves the characterized runtime export names at the utility boundary', () => {
    const modules = {
      foundationDefaults,
      foundationRecovery,
      foundationProjection,
      foundationProvenance,
      foundationValidation,
      iconExport,
      inspectorProtocol,
      paletteGenerator,
      panelBrandingExport,
      panelBrandingValidation,
      rawOverrideValidation,
      themeResolver,
      themeSerialization,
      themeValidation,
      vanillaCssExport,
    }

    for (const [name, exports] of Object.entries(migratedRuntimeExports)) {
      expect(Object.keys(modules[name as keyof typeof modules]).sort()).toEqual([...exports].sort())
    }
  })
})
