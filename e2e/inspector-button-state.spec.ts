import { expect, test } from '@playwright/test'
import { authenticate, baseUrl } from './color-picker-acceptance.helpers'

test.skip(process.env.COMPOSE_E2E !== '1', 'Requires the canonical Compose stack')

test('Inspector communicates its enabled state on the button and toggles with the keyboard', async ({ page }) => {
  await authenticate(page)
  await page.goto(baseUrl)
  const inspector = page.getByRole('button', { name: 'Inspector', exact: true })
  if (await inspector.getAttribute('aria-pressed') === 'true') await inspector.click()
  await expect(inspector).toHaveAttribute('aria-pressed', 'false')
  const inactiveBackground = await inspector.evaluate((element) => getComputedStyle(element).backgroundColor)
  await inspector.focus()
  await page.keyboard.press('Space')
  await expect(inspector).toHaveAttribute('aria-pressed', 'true')
  await expect(inspector).toContainText('On')
  await expect.poll(() => inspector.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(inactiveBackground)
  await page.keyboard.press('Space')
  await expect(inspector).toHaveAttribute('aria-pressed', 'false')
  await expect(inspector).not.toContainText('On')
})
