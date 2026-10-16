import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LocalThemeManager from '@/components/LocalThemeManager.vue'
import type { LocalThemeRecord } from '@/models/local-theme.model'

const themes: LocalThemeRecord[] = [
  { id: 'one', name: 'Marketing', updatedAt: 1 },
  { id: 'two', name: 'Admin', updatedAt: 2 },
]

const mountManager = (storageError: string | null = null) => mount(LocalThemeManager, {
  props: { themes, activeThemeId: 'one', storageError },
})

describe('LocalThemeManager', () => {
  it('opens an accessible dialog from a named trigger and marks the active theme', async () => {
    const wrapper = mountManager()
    await wrapper.get('[aria-label="Manage themes"]').trigger('click')

    const dialog = wrapper.get('dialog')
    expect(dialog.attributes('aria-labelledby')).toBe('local-theme-dialog-title')
    expect(dialog.attributes('open')).toBeDefined()
    expect(wrapper.get('[data-local-theme-row="one"]').attributes('aria-current')).toBe('true')
    expect(wrapper.get('[data-local-theme-row="one"]').text()).toContain('Active')
    expect(wrapper.find('[data-local-theme-storage-status]').exists()).toBe(false)
  })

  it('emits create, open, rename, duplicate, and delete only after confirmation', async () => {
    const wrapper = mountManager()
    await wrapper.get('[aria-label="Manage themes"]').trigger('click')
    await wrapper.get('[aria-label="Create theme"]').trigger('click')
    await wrapper.get('[aria-label="Open Admin"]').trigger('click')
    await wrapper.get('[aria-label="Rename Marketing"]').trigger('click')
    await wrapper.get('[aria-label="Rename theme name"]').setValue('  Website  ')
    await wrapper.get('[aria-label="Save theme name"]').trigger('click')
    await wrapper.get('[aria-label="Duplicate Marketing"]').trigger('click')
    await wrapper.get('[aria-label="Delete Marketing"]').trigger('click')

    expect(wrapper.get('[role="alertdialog"]').text()).toContain('Delete Marketing')
    expect(wrapper.emitted('delete')).toBeUndefined()
    await wrapper.get('[aria-label="Confirm delete Marketing"]').trigger('click')

    expect(wrapper.emitted('create')).toHaveLength(1)
    expect(wrapper.emitted('open')).toEqual([['two']])
    expect(wrapper.emitted('rename')).toEqual([['one', 'Website']])
    expect(wrapper.emitted('duplicate')).toEqual([['one']])
    expect(wrapper.emitted('delete')).toEqual([['one']])
  })

  it('rejects a blank rename with an accessible error', async () => {
    const wrapper = mountManager()
    await wrapper.get('[aria-label="Manage themes"]').trigger('click')
    await wrapper.get('[aria-label="Rename Marketing"]').trigger('click')
    await wrapper.get('[aria-label="Rename theme name"]').setValue('   ')
    await wrapper.get('[aria-label="Save theme name"]').trigger('click')

    expect(wrapper.get('[role="alert"][data-local-theme-rename-error]').text()).toContain('name is required')
    expect(wrapper.emitted('rename')).toBeUndefined()
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const wrapper = mountManager()
    const trigger = wrapper.get('[aria-label="Manage themes"]')
    const focus = vi.spyOn(trigger.element as HTMLButtonElement, 'focus')
    await trigger.trigger('click')
    const dialog = wrapper.get('dialog')
    await dialog.trigger('keydown', { key: 'Escape' })
    await wrapper.vm.$nextTick()

    expect(dialog.attributes('open')).toBeUndefined()
    expect(focus).toHaveBeenCalled()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('announces storage errors without disabling editor controls', async () => {
    const wrapper = mountManager('Storage quota exceeded')
    expect(wrapper.get('[role="status"][aria-live="polite"]').text()).toContain('Storage quota exceeded')
    expect(wrapper.get('[aria-label="Manage themes"]').attributes('disabled')).toBeUndefined()
  })

  it('does not depend on storage APIs', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    mountManager()
    expect(spy).not.toHaveBeenCalled()
  })
})
