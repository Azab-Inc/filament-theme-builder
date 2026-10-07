import { expect, test } from '@playwright/test'

test('Vue builder scaffold renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173')

  await expect(page.getByRole('heading', { name: 'You did it!' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'vuejs.org' })).toHaveAttribute(
    'href',
    'https://vuejs.org/',
  )
})

test('Filament admin login renders', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/admin/login')

  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  await expect(page.getByLabel(/email address/i)).toBeVisible()
})
