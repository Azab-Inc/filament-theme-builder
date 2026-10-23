import { onMounted, ref, toRaw, watch } from 'vue'

import type { UsePreviewThemeOptions } from '@/models/use-preview-theme-options.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { toLegacyPreviewTheme } from '@/utils/preview-theme-adapter'

const registry = createThemeRegistry()

export function usePreviewTheme({
  theme,
  activeMode,
  previewUrl,
  iframe,
  onPreviewLoad,
}: UsePreviewThemeOptions) {
  const iframeSrc = ref(previewUrl)
  const runtimeLoading = ref(false)
  const targetOrigin = new URL(previewUrl, window.location.href).origin

  function postTheme(): void {
    const target = iframe.value?.contentWindow
    if (!target) return
    target.postMessage(
      {
        type: 'ftb:theme:update',
        schemaVersion: 1,
        activeMode: activeMode.value,
        theme: toLegacyPreviewTheme(structuredClone(JSON.parse(JSON.stringify(toRaw(theme.theme)))), registry),
        projection: theme.previewFoundation(activeMode.value),
      },
      targetOrigin,
    )
  }

  function refreshRuntimePreview(): void {
    runtimeLoading.value = true
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(theme.theme.branding))))
    const separator = previewUrl.includes('?') ? '&' : '?'
    iframeSrc.value = `${previewUrl}${separator}ftb_branding=${encodeURIComponent(encoded)}`
  }

  function handlePreviewLoad(): void {
    runtimeLoading.value = false
    postTheme()
    onPreviewLoad?.()
  }

  watch(() => theme.theme, postTheme, { deep: true })
  watch(activeMode, postTheme)
  watch(() => theme.theme.branding.logoHeight, postTheme)
  watch(
    () =>
      JSON.stringify([
        theme.theme.branding.appName,
        theme.theme.branding.lightLogo,
        theme.theme.branding.darkLogo,
        theme.theme.branding.brandTypography,
        theme.theme.branding.contentWidth,
        theme.theme.branding.sidebar,
      ]),
    refreshRuntimePreview,
  )

  onMounted(postTheme)

  return {
    iframeSrc,
    runtimeLoading,
    postTheme,
    refreshRuntimePreview,
    onPreviewLoad: handlePreviewLoad,
  }
}
