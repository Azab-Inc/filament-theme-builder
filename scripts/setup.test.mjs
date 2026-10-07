import assert from 'node:assert/strict'
import test from 'node:test'
import { repositoryRoot, hasApplicationKey } from './setup-utils.mjs'

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
