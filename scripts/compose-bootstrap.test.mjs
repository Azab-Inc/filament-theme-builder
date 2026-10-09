import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const script = await readFile(new URL('./compose-bootstrap.sh', import.meta.url), 'utf8').catch(() => '')

test('bootstrap installs dev dependencies before env, key, migrations and optimize', () => {
  const install = script.indexOf('composer install')
  const env = script.indexOf('.env.example')
  const key = script.indexOf('key:generate')
  const migrate = script.indexOf('migrate --force')
  const optimize = script.indexOf('artisan optimize')
  assert.ok(install >= 0 && env > install && key > env && migrate > key && optimize > migrate)
  assert.match(script, /BOOTSTRAP_PRODUCTION/)
  assert.match(script, /APP_KEY/)
})

test('bootstrap propagates command failure', () => {
  assert.match(script, /set -eu/)
})
