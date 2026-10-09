import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(new URL('./compose-bootstrap.sh', import.meta.url))
const script = await readFile(scriptPath, 'utf8').catch(() => '')

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

// --- Behavioral harness -----------------------------------------------------
// The assertions above inspect source order; these run the real script against
// stub `composer`/`php` binaries so the APP_KEY guard is proven, not inferred.

const composerStub = '#!/bin/sh\necho "composer $*" >> "$BOOTSTRAP_LOG"\n'

// Mirrors the real `key:generate`: writes the fresh key back into .env.
const phpStub = [
  '#!/bin/sh',
  'echo "php $*" >> "$BOOTSTRAP_LOG"',
  'if [ "$1" = "artisan" ] && [ "$2" = "key:generate" ]; then',
  "  sed -i 's/^\\([[:space:]]*\\(export[[:space:]]\\{1,\\}\\)\\{0,1\\}APP_KEY[[:space:]]*=[[:space:]]*\\).*/\\1base64:generated/' .env",
  'fi',
  'exit 0',
  '',
].join('\n')

async function bootstrapSandbox(envContent) {
  const root = await mkdtemp(join(tmpdir(), 'compose-bootstrap-'))
  const app = join(root, 'app')
  const bin = join(root, 'bin')
  const log = join(root, 'commands.log')
  await mkdir(app)
  await mkdir(bin)
  await writeFile(join(app, '.env.example'), 'APP_NAME=Demo\nAPP_KEY=\n')
  await writeFile(join(app, '.env'), envContent)
  await writeFile(join(bin, 'composer'), composerStub, { mode: 0o755 })
  await writeFile(join(bin, 'php'), phpStub, { mode: 0o755 })
  return {
    async run(env = {}) {
      await rm(log, { force: true })
      const childEnv = {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        APP_DIR: app,
        BOOTSTRAP_LOG: log,
      }
      delete childEnv.APP_KEY
      execFileSync('sh', [scriptPath], { env: { ...childEnv, ...env }, stdio: 'pipe' })
      return readFile(log, 'utf8')
    },
    async cleanup() {
      await rm(root, { recursive: true, force: true })
    },
  }
}

test('bootstrap generates a key for comment-only and whitespace-only APP_KEY values', async () => {
  const commented = await bootstrapSandbox('APP_NAME=Demo\nAPP_KEY= # placeholder comment\n')
  try {
    const first = await commented.run()
    assert.match(first, /key:generate/)
    assert.match(first, /migrate --force/)
    // Idempotence: once key:generate writes the real key back, later boots stay quiet.
    assert.doesNotMatch(await commented.run(), /key:generate/)
  } finally {
    await commented.cleanup()
  }

  const blank = await bootstrapSandbox('APP_NAME=Demo\nAPP_KEY=\n')
  try {
    assert.match(await blank.run({ APP_KEY: '   ' }), /key:generate/)
  } finally {
    await blank.cleanup()
  }
})

test('bootstrap leaves real APP_KEY values from .env or the environment untouched', async () => {
  const seeded = await bootstrapSandbox('APP_NAME=Demo\nAPP_KEY=base64:seeded\n')
  try {
    assert.doesNotMatch(await seeded.run(), /key:generate/)
    assert.doesNotMatch(await seeded.run(), /key:generate/)
  } finally {
    await seeded.cleanup()
  }

  const injected = await bootstrapSandbox('APP_NAME=Demo\nAPP_KEY=\n')
  try {
    assert.doesNotMatch(await injected.run({ APP_KEY: 'base64:injected' }), /key:generate/)
  } finally {
    await injected.cleanup()
  }
})
