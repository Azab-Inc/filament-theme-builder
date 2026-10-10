import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { repositoryRoot, hasApplicationKey } from './setup-utils.mjs'

const setupScript = readFileSync(fileURLToPath(new URL('./setup.mjs', import.meta.url)), 'utf8')

test('setup root resolves from the setup module rather than the caller cwd', () => {
  assert.equal(repositoryRoot('file:///workspace/project/scripts/setup.mjs'), '/workspace/project')
})

test('non-empty application keys survive whitespace and export formatting', () => {
  assert.equal(hasApplicationKey(' APP_KEY = base64:existing\n'), true)
  assert.equal(hasApplicationKey('export APP_KEY = "base64:existing"\n'), true)
})

test('missing and empty application keys are generated', () => {
  assert.equal(hasApplicationKey('APP_KEY=\n'), false)
  assert.equal(hasApplicationKey('APP_NAME=Demo\n'), false)
})

test('fresh setup runs the dedicated seeders after migrations', () => {
  const migrate = setupScript.indexOf("['artisan', 'migrate', '--force']")
  const seed = setupScript.indexOf("['artisan', 'db:seed', '--force']")
  assert.ok(migrate >= 0 && seed > migrate)
})
