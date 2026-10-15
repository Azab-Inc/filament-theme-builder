import { describe, expect, it, vi } from 'vitest'

import { useRecovery } from '@/composables/use-recovery'

describe('useRecovery', () => {
  it('delegates restoration to the canonical store action', () => {
    const restoreLegacyRecovery = vi.fn(() => true)
    const recovery = useRecovery({
      getLegacyRecoveryJson: () => null,
      restoreLegacyRecovery,
    })

    expect(recovery.restoreLegacyRecovery()).toBe(true)
    expect(restoreLegacyRecovery).toHaveBeenCalledOnce()
  })

  it('downloads the exact archived JSON through the browser', async () => {
    const archive = '{"schemaVersion":4,"preserved":true}'
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:legacy-recovery')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    let downloadedFilename = ''
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedFilename = this.download
    })
    const recovery = useRecovery({
      getLegacyRecoveryJson: () => archive,
      restoreLegacyRecovery: () => true,
    })

    recovery.downloadLegacyRecovery()

    expect(createObjectURL).toHaveBeenCalledOnce()
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(await blob.text()).toBe(archive)
    expect(downloadedFilename).toBe('filament-theme-legacy-recovery.json')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:legacy-recovery')

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
    click.mockRestore()
  })

  it('does not start a download when the store has no archived JSON', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:unused')
    const recovery = useRecovery({
      getLegacyRecoveryJson: () => null,
      restoreLegacyRecovery: () => true,
    })

    recovery.downloadLegacyRecovery()

    expect(createObjectURL).not.toHaveBeenCalled()
    createObjectURL.mockRestore()
  })
})
