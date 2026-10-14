import { expect, test } from '@playwright/test'

const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires a running Compose stack')

test('preview bridge enables the versioned inspector only for its allowed parent', async ({ page }) => {
  await page.goto(baseUrl)
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
  await page.goto(baseUrl)
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
      const hovered = sidebar.classList.contains('ftb-inspector-hover');
      sidebar.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
      const hoverCleared = !sidebar.classList.contains('ftb-inspector-hover');
      nested.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      nested.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return { hovered, hoverCleared, selected: sidebar.classList.contains('ftb-inspector-selected') };
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
