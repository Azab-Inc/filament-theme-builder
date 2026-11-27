import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'
const previewUrl = baseUrl.split('?')[0]

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')

test('preview bridge enables the versioned inspector only for its allowed parent', async ({ page }) => {
  await page.goto(previewUrl)
  const iframe = page.locator('iframe[title="Filament preview"]')
  await expect(iframe).toBeVisible()

  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await expect(frame.locator('#ftb-preview-bridge')).toBeAttached()

  const response = await page.evaluate(async () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
    const target = iframe.contentWindow!
    const events: unknown[] = []
    const listener = (event: MessageEvent) => {
      if (event.source === target) events.push(event.data)
    }
    window.addEventListener('message', listener)
    target.postMessage({ type: 'ftb:inspector:enable', protocolVersion: 1 }, location.origin)
    await new Promise((resolve) => setTimeout(resolve, 50))
    const enabled = await iframe.contentWindow!.eval('document.documentElement.classList.contains("ftb-inspector-enabled")')
    target.postMessage({ type: 'ftb:inspector:disable', protocolVersion: 1 }, location.origin)
    await new Promise((resolve) => setTimeout(resolve, 50))
    const disabled = await iframe.contentWindow!.eval('!document.documentElement.classList.contains("ftb-inspector-enabled")')
    window.removeEventListener('message', listener)
    return { events, enabled, disabled }
  })

  expect(response.enabled).toBe(true)
  expect(response.disabled).toBe(true)
  expect(response.events).toContainEqual({ type: 'ftb:inspector:ready', protocolVersion: 1 })
  expect(response.events).toContainEqual({ type: 'ftb:inspector:clear', protocolVersion: 1 })
})

test('preview inspector sends hover and selection evidence for the nearest semantic ancestor', async ({ page }) => {
  await page.goto(previewUrl)
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await expect(frame.getByRole('heading', { name: /dashboard/i })).toBeVisible()

  const events = await page.evaluate(async () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
    const frameWindow = iframe.contentWindow!
    const received: unknown[] = []
    const listener = (event: MessageEvent) => {
      if (event.source === frameWindow) received.push(event.data)
    }
    window.addEventListener('message', listener)
    frameWindow.postMessage({ type: 'ftb:inspector:enable', protocolVersion: 1 }, location.origin)
    await new Promise((resolve) => setTimeout(resolve, 50))
    const result = await frameWindow.eval(`(() => {
      const sidebar = document.querySelector('.fi-sidebar');
      if (!sidebar) return false;
      const nested = sidebar.querySelector('a span') ?? sidebar.querySelector('a') ?? sidebar;
      nested.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      const hovered = Boolean(document.querySelector('.ftb-inspector-hover'));
      const hoverTarget = document.querySelector('.ftb-inspector-hover');
      hoverTarget?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
      const hoverCleared = !document.querySelector('.ftb-inspector-hover');
      nested.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      nested.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return { hovered, hoverCleared, selected: Boolean(document.querySelector('.ftb-inspector-selected')) };
    })()`)
    await new Promise((resolve) => setTimeout(resolve, 50))
    frameWindow.postMessage({ type: 'ftb:inspector:disable', protocolVersion: 1 }, location.origin)
    await new Promise((resolve) => setTimeout(resolve, 50))
    const cleaned = await frameWindow.eval(`(() => {
      const sidebar = document.querySelector('.fi-sidebar');
      return sidebar && !sidebar.classList.contains('ftb-inspector-hover')
        && !sidebar.classList.contains('ftb-inspector-selected')
        && !document.getElementById('ftb-inspector-style');
    })()`)
    window.removeEventListener('message', listener)
    return { received, ...result, cleaned }
  })

  expect(events.hovered).toBe(true)
  expect(events.hoverCleared).toBe(true)
  expect(events.selected).toBe(true)
  expect(events.cleaned).toBe(true)
  expect(events.received).toContainEqual(expect.objectContaining({ type: 'ftb:inspector:hover', protocolVersion: 1 }))
  expect(events.received).toContainEqual(expect.objectContaining({ type: 'ftb:inspector:select', protocolVersion: 1 }))
})

test('preview bridge ignores inspector commands from invalid origins, sources, and versions', async ({ page }) => {
  await page.goto(baseUrl)
  const result = await page.evaluate(async () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
    const frameWindow = iframe.contentWindow!
    frameWindow.eval(`
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://untrusted.example', source: window.parent,
        data: { type: 'ftb:inspector:enable', protocolVersion: 1 },
      }));
      window.dispatchEvent(new MessageEvent('message', {
        origin: location.origin, source: null,
        data: { type: 'ftb:inspector:enable', protocolVersion: 1 },
      }));
      window.dispatchEvent(new MessageEvent('message', {
        origin: location.origin, source: window.parent,
        data: { type: 'ftb:inspector:enable', protocolVersion: 2 },
      }));
    `)
    return frameWindow.eval('!document.documentElement.classList.contains("ftb-inspector-enabled")')
  })
  expect(result).toBe(true)
})

test('surfaces assignment collision feedback and preserves the last accepted theme', async ({ page }) => {
  await page.goto(baseUrl)
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await page.getByRole('button', { name: 'Inspector' }).click()
  await frame.locator('.fi-section-header').nth(1).click()
  await page.evaluate(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
    const frameWindow = iframe.contentWindow!
    ;(frameWindow as Window & { __ftbAcceptedThemeMessages?: number }).__ftbAcceptedThemeMessages = 0
    frameWindow.addEventListener('message', (event) => {
      if (event.source === window.parent && event.data?.type === 'ftb:theme:update') {
        ;(frameWindow as Window & { __ftbLastThemeMessage?: unknown }).__ftbLastThemeMessage = event.data
        ;(frameWindow as Window & { __ftbAcceptedThemeMessages?: number }).__ftbAcceptedThemeMessages = ((frameWindow as Window & { __ftbAcceptedThemeMessages?: number }).__ftbAcceptedThemeMessages ?? 0) + 1
      }
    })
  })
  await page.locator('#unique-element-id-toggle').check()
  const id = await page.locator('#unique-element-id').inputValue()
  const result = await page.evaluate(async (assignmentId) => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
    const frameWindow = iframe.contentWindow!
    await new Promise((resolve) => setTimeout(resolve, 50))
    const accepted = (frameWindow as Window & { __ftbLastThemeMessage?: { theme?: { uniqueElementIds?: unknown[] } } }).__ftbLastThemeMessage
    const collisionId = 'ftb-test-owned'
    await frameWindow.eval(`document.querySelector('.fi-section-header-text-ctn')?.setAttribute('id', '${collisionId}')`)
    const before = await frameWindow.eval(`(() => ({ body: getComputedStyle(document.body).backgroundColor, style: document.getElementById('ftb-managed-theme')?.textContent ?? '', id: document.querySelectorAll('#${assignmentId}').length }))()`)
    const rejections: unknown[] = []
    window.addEventListener('message', (event) => {
      if (event.source === frameWindow && event.data?.type === 'ftb:theme:rejected') rejections.push(event.data)
    })
    const corrupted = structuredClone(accepted as object) as { theme: { uniqueElementIds: Array<{ id: string }> } }
    corrupted.theme.uniqueElementIds[0].id = collisionId
    frameWindow.postMessage(corrupted, location.origin)
    await new Promise((resolve) => setTimeout(resolve, 100))
    const after = await frameWindow.eval(`(() => ({ body: getComputedStyle(document.body).backgroundColor, style: document.getElementById('ftb-managed-theme')?.textContent ?? '', id: document.querySelectorAll('#${assignmentId}').length }))()`)
    return { before, after, rejected: rejections.find((entry) => (entry as { reason?: string }).reason?.includes('collision')), collisionExists: await frameWindow.eval(`Boolean(document.getElementById('${collisionId}'))`), acceptedThemeMessages: (frameWindow as Window & { __ftbAcceptedThemeMessages?: number }).__ftbAcceptedThemeMessages ?? 0 }
  }, id)
  expect(result.collisionExists).toBe(true)
  expect(result.acceptedThemeMessages).toBeGreaterThan(0)
  expect(result.rejected).toEqual(expect.objectContaining({ reason: expect.stringContaining('collision') }))
  await expect(page.locator('#unique-element-id-error')).toContainText('collision')
  await expect(page.locator('#unique-element-id-error')).toHaveAttribute('role', 'alert')
  expect(result.after).toEqual(result.before)
})

const assignmentCorruptions = [
  ['bad ID', (assignment: Record<string, unknown>) => { assignment.id = '1-bad' }],
  ['unsafe selector', (assignment: Record<string, unknown>) => { assignment.sourceSelector = '#unsafe' }],
  ['duplicate', (assignment: Record<string, unknown>, assignments: unknown[]) => { assignments.push({ ...assignment }) }],
  ['reserved ID', (assignment: Record<string, unknown>) => { assignment.id = 'ftb-managed-theme' }],
  ['out-of-range match', (assignment: Record<string, unknown>) => { assignment.matchIndex = 1000 }],
  ['null assignment', (_assignment: Record<string, unknown>, assignments: unknown[]) => { assignments[0] = null }],
] as const

for (const [label, corrupt] of assignmentCorruptions) {
  test(`rejects assignment-only ${label} corruption without mutating the accepted state`, async ({ page }) => {
    await page.goto(baseUrl)
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section-header').nth(1).click()
    await page.evaluate(() => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
      const frameWindow = iframe.contentWindow!
      frameWindow.addEventListener('message', (event) => {
        if (event.source === window.parent && event.data?.type === 'ftb:theme:update') (frameWindow as Window & { __ftbLastThemeMessage?: unknown }).__ftbLastThemeMessage = event.data
      })
    })
    await page.locator('#unique-element-id-toggle').check()
    const id = await page.locator('#unique-element-id').inputValue()
    const statusBefore = await page.locator('[data-inspector-status]').textContent()
    const result = await page.evaluate(async ({ id, label }) => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
      const frameWindow = iframe.contentWindow!
      const messages: unknown[] = []
      const accepted: unknown[] = []
      window.addEventListener('message', (event) => { if (event.source === frameWindow && event.data?.type === 'ftb:theme:rejected') messages.push(event.data) })
      frameWindow.addEventListener('ftb:preview-message-accepted', () => accepted.push(true))
      const source = (frameWindow as Window & { __ftbLastThemeMessage?: unknown }).__ftbLastThemeMessage
      const corrupted = structuredClone(source as object) as { theme: { uniqueElementIds: unknown[] } }
      const assignments = corrupted.theme.uniqueElementIds
      const assignment = assignments[0] as Record<string, unknown>
      if (label === 'bad ID') assignment.id = '1-bad'
      if (label === 'unsafe selector') assignment.sourceSelector = '#unsafe'
      if (label === 'duplicate') assignments.push({ ...assignment })
      if (label === 'reserved ID') assignment.id = 'ftb-managed-theme'
      if (label === 'out-of-range match') assignment.matchIndex = 1000
      if (label === 'null assignment') assignments[0] = null
      const before = await frameWindow.eval(`(() => ({ style: document.getElementById('ftb-managed-theme')?.textContent ?? '', id: document.querySelectorAll('#${id}').length }))()`)
      const localStorageBefore = localStorage.getItem('ftb-theme')
      frameWindow.postMessage(corrupted, location.origin)
      await new Promise((resolve) => setTimeout(resolve, 100))
      const after = await frameWindow.eval(`(() => ({ style: document.getElementById('ftb-managed-theme')?.textContent ?? '', id: document.querySelectorAll('#${id}').length }))()`)
      return { before, after, accepted: accepted.length, messages, localStorageBefore, localStorageAfter: localStorage.getItem('ftb-theme') }
    }, { id, label })
    expect(result.accepted).toBe(0)
    expect(result.messages).toEqual([])
    expect(result.after).toEqual(result.before)
    expect(result.localStorageAfter).toBe(result.localStorageBefore)
    expect(await page.locator('[data-inspector-status]').textContent()).toBe(statusBefore)
    await expect(page.locator('#unique-element-id-error')).toHaveCount(0)
  })
}

const rawOverrideCorruptions = [
  ['missing properties', (override: Record<string, unknown>) => { delete override.properties }],
  ['null properties', (override: Record<string, unknown>) => { override.properties = null }],
  ['null darkProperties', (override: Record<string, unknown>) => { override.darkProperties = null }],
] as const

for (const [label, corrupt] of rawOverrideCorruptions) {
  test(`rejects complete parent-sourced ${label} raw override without page errors or mutation`, async ({ page }) => {
    await page.goto(baseUrl)
    const frame = page.frameLocator('iframe[title="Filament preview"]')
    await page.getByRole('button', { name: 'Inspector' }).click()
    await frame.locator('.fi-section-header').nth(1).click()
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.evaluate(() => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
      const frameWindow = iframe.contentWindow!
      frameWindow.addEventListener('message', (event) => {
        if (event.source === window.parent && event.data?.type === 'ftb:theme:update') (frameWindow as Window & { __ftbLastThemeMessage?: unknown }).__ftbLastThemeMessage = event.data
      })
    })
    await page.locator('#unique-element-id-toggle').check()
    const result = await page.evaluate(async ({ label }) => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
      const frameWindow = iframe.contentWindow!
      await new Promise((resolve) => setTimeout(resolve, 75))
      const source = (frameWindow as Window & { __ftbLastThemeMessage?: unknown }).__ftbLastThemeMessage
      const corrupted = structuredClone(source as object) as { theme: { rawOverrides?: Array<Record<string, unknown>> } }
      const override: Record<string, unknown> = { selector: '.fi-sidebar', properties: { color: '#123456' } }
      if (label === 'missing properties') delete override.properties
      if (label === 'null properties') override.properties = null
      if (label === 'null darkProperties') override.darkProperties = null
      corrupted.theme.rawOverrides = [override]
      const before = await frameWindow.eval(`(() => ({ style: document.getElementById('ftb-managed-theme')?.textContent ?? '', body: getComputedStyle(document.body).color }))()`)
      let accepted = 0
      frameWindow.addEventListener('ftb:preview-message-accepted', () => { accepted += 1 })
      frameWindow.postMessage(corrupted, location.origin)
      await new Promise((resolve) => setTimeout(resolve, 100))
      const after = await frameWindow.eval(`(() => ({ style: document.getElementById('ftb-managed-theme')?.textContent ?? '', body: getComputedStyle(document.body).color }))()`)
      return { before, after, accepted }
    }, { label })
    expect(pageErrors).toEqual([])
    expect(result.accepted).toBe(0)
    expect(result.after).toEqual(result.before)
    await expect(frame.locator('#ftb-managed-theme')).toBeAttached()
  })
}

test('accepts a complete parent-sourced envelope and retries a missing valid route', async ({ page }) => {
  await page.goto(baseUrl)
  const frame = page.frameLocator('iframe[title="Filament preview"]')
  await page.getByRole('button', { name: 'Inspector' }).click()
  await frame.locator('.fi-section-header').nth(1).click()
  await page.evaluate(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
    const frameWindow = iframe.contentWindow!
    frameWindow.addEventListener('message', (event) => {
      if (event.source === window.parent && event.data?.type === 'ftb:theme:update') (frameWindow as Window & { __ftbLastThemeMessage?: unknown }).__ftbLastThemeMessage = event.data
    })
  })
  await page.locator('#unique-element-id-toggle').check()
  const result = await page.evaluate(async () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!
    const frameWindow = iframe.contentWindow!
    const source = (frameWindow as Window & { __ftbLastThemeMessage?: unknown }).__ftbLastThemeMessage
    const envelope = structuredClone(source as object) as { theme: { uniqueElementIds: Array<{ id: string; sourceSelector: string; matchIndex: number }> } }
    const id = envelope.theme.uniqueElementIds[0].id
    envelope.theme.uniqueElementIds[0] = { id, sourceSelector: '.fi-late-route', matchIndex: 0 }
    let accepted = 0
    frameWindow.addEventListener('ftb:preview-message-accepted', () => { accepted += 1 })
    frameWindow.postMessage(envelope, location.origin)
    await new Promise((resolve) => setTimeout(resolve, 75))
    const skipped = await frameWindow.eval(`document.querySelectorAll('#${id}').length`)
    const late = frameWindow.document.createElement('div')
    late.className = 'fi-late-route'
    frameWindow.document.body.append(late)
    frameWindow.postMessage(envelope, location.origin)
    await new Promise((resolve) => setTimeout(resolve, 75))
    const retried = await frameWindow.eval(`document.querySelectorAll('#${id}').length`)
    return { accepted, skipped, retried }
  })
  expect(result.accepted).toBeGreaterThanOrEqual(2)
  expect(result.skipped).toBe(0)
  expect(result.retried).toBe(1)
})
