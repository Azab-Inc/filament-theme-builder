import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { useThemeStore } from '@/stores/theme'

const scopes = [
  ['global', '#101828', {}],
  ['component', '#fb2c36', { componentId: 'form' }],
  ['variant', '#123456', { componentId: 'form', variantId: 'default' }],
  ['state', '#654321', { componentId: 'form', variantId: 'default', stateId: 'focus' }],
] as const

describe('semantic component color persistence', () => {
  it('writes each scope with only its valid context keys and reloads all records', async () => {
    localStorage.clear()
    const firstPinia = createPinia(); const first = mount(App, { global: { plugins: [firstPinia] } }); const firstStore = useThemeStore(firstPinia)
    const componentsTab = first.findAll('[role="tab"]').find((tab) => tab.text().includes('Components'))
    await componentsTab!.trigger('click')
    for (const [scope, value] of scopes) { await first.get(`#product-name-${scope}-background`).setValue(value); await nextTick() }
    const records = firstStore.theme.overrides.filter((record) => record.targetId === 'form.product-name')
    for (const [scope, value, context] of scopes) {
      const record = records.find((candidate) => candidate.scope === scope)
      expect(record).toMatchObject({ targetId: 'form.product-name', controlId: 'background', scope, value, ...context })
      expect(record && Object.keys(record).filter((key) => ['componentId', 'variantId', 'stateId'].includes(key))).toEqual(Object.keys(context))
    }
    firstStore.saveTheme(); first.unmount(); firstStore.$dispose()
    const secondPinia = createPinia(); const second = mount(App, { global: { plugins: [secondPinia] } }); const secondStore = useThemeStore(secondPinia)
    expect(secondStore.theme.overrides.filter((record) => record.targetId === 'form.product-name')).toHaveLength(4)
    second.unmount(); secondStore.$dispose(); localStorage.clear()
  })
})
