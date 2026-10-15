import { expectTypeOf, it } from 'vitest'
import type { BrandingAssetSetting } from '@/models/branding-asset-setting.model'
import type { BrandingSettingChange } from '@/models/branding-setting-change.model'
import type { BrandingAssetUpload } from '@/dtos/branding-asset-upload.dto'
import type { BrandingSettingsPanelEmits } from '@/components/branding-settings-panel-emits.model'
import type { BrandingSettingsPanelProps } from '@/components/branding-settings-panel-props.model'
import type {
  BrandingAssetSetting as CompatibilityAssetSetting,
  BrandingAssetUpload as CompatibilityAssetUpload,
  BrandingSettingChange as CompatibilitySettingChange,
  BrandingSettingsPanelEmits as CompatibilityEmits,
  BrandingSettingsPanelProps as CompatibilityProps,
} from '@/components/branding-settings-panel.model'

it('keeps the panel type aliases available from their dedicated files and compatibility module', () => {
  expectTypeOf<CompatibilityAssetSetting>().toEqualTypeOf<BrandingAssetSetting>()
  expectTypeOf<CompatibilitySettingChange>().toEqualTypeOf<BrandingSettingChange>()
  expectTypeOf<CompatibilityAssetUpload>().toEqualTypeOf<BrandingAssetUpload>()
  expectTypeOf<CompatibilityProps>().toEqualTypeOf<BrandingSettingsPanelProps>()
  expectTypeOf<CompatibilityEmits>().toEqualTypeOf<BrandingSettingsPanelEmits>()
})
