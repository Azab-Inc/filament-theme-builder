import { expect, type Page } from '@playwright/test'

export const baseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'

export const readCanonical = (page: Page) => page.evaluate(() => {
  const id = localStorage.getItem('ftb-theme-active')
  const raw = id ? localStorage.getItem(`ftb-theme:${id}`) : null
  return raw ? JSON.parse(raw) : null
})

export async function openChooser(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: `Choose ${label} from Tailwind palette` }).click()
  await expect(page.getByRole('dialog', { name: `${label} color choices` })).toBeVisible()
}

export async function chooseToken(page: Page, token = 'gray 900 #101828'): Promise<void> {
  await page.getByRole('searchbox', { name: /search.*color/i }).fill(token.split(' ').slice(0, 2).join('-'))
  await page.getByRole('button', { name: new RegExp(token.replaceAll(' ', '\\s+'), 'i') }).click()
}

export async function setPreviewRoute(page: Page, path: string): Promise<import('@playwright/test').Frame> {
  await page.locator('iframe[title="Filament preview"]').evaluate((frame, url) => { frame.src = url }, `${baseUrl}${path}`)
  await expect.poll(() => page.frames().find((frame) => frame.url().includes(path))?.url() ?? '').toContain(path)
  const frame = page.frames().find((candidate) => candidate.url().includes(path))!
  await expect(frame.locator('body')).toBeVisible()
  return frame
}

export async function expectNoOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
}
