import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { useThemeImport } from '@/composables/use-theme-import'

const json = '{"schemaVersion":1,"colors":{"primary":"#123456"}}'
const file = (name: string, text = json) => new File([text], name, { type: 'application/json' })

describe('theme import UI flow', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
  afterEach(() => vi.restoreAllMocks())

  it('rejects oversized files before reading their contents', async () => {
    const model = useThemeImport(useThemeStore())
    const large = { name: 'large.json', size: 1_048_577, arrayBuffer: vi.fn() } as unknown as File
    await model.chooseFile(large)
    expect(large.arrayBuffer).not.toHaveBeenCalled()
    expect(model.state.error).toContain('1 MiB')
  })

  it('reads a file exactly at the 1 MiB limit', async () => {
    const model = useThemeImport(useThemeStore())
    const bytes = new TextEncoder().encode(json)
    const exact = { name: 'exact.json', size: 1_048_576, arrayBuffer: vi.fn(async () => bytes.buffer) } as unknown as File
    await model.chooseFile(exact)
    expect(exact.arrayBuffer).toHaveBeenCalledOnce()
    expect(model.state.preview?.byteLength).toBe(bytes.byteLength)
  })

  it('does not mutate themes when preview is cancelled', async () => {
    const store = useThemeStore()
    const initial = store.themes.length
    const model = useThemeImport(store)
    await model.chooseFile(file('legacy.json'))
    expect(model.state.preview?.migrationPath).toEqual([1, 2, 3, 4, 5])
    expect(store.themes).toHaveLength(initial)
    model.cancel()
    expect(store.themes).toHaveLength(initial)
    expect(model.state.preview).toBeNull()
  })

  it.each([
    ['malformed JSON', '{'],
    ['migration failure', '{"schemaVersion":9,"colors":{"primary":"#123456"}}'],
  ])('reports a safe %s error without mutating themes', async (_label, contents) => {
    const store = useThemeStore()
    const initial = store.themes.length
    const model = useThemeImport(store)
    await model.chooseFile(file('invalid.json', contents))
    expect(model.state.error).toBeTruthy()
    expect(model.state.preview).toBeNull()
    expect(store.themes).toHaveLength(initial)
  })

  it('requires confirmation to create and open a fresh theme', async () => {
    const store = useThemeStore()
    const model = useThemeImport(store)
    await model.chooseFile(file('legacy.json'))
    model.setName('Imported theme')
    const result = await model.confirm()
    expect(result).toMatchObject({ ok: true, record: { name: 'Imported theme' } })
    expect(store.activeThemeName).toBe('Imported theme')
  })
})
