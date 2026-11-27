import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, existsSync, rmSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareBuildOutput } from './prepare-build-output.mjs'

test('preserves a writable build directory for Vite to clean', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-build-output-'))
  const output = join(root, 'dist')
  mkdirSync(output)
  writeFileSync(join(output, 'index.html'), 'old')

  prepareBuildOutput(output)

  assert.equal(existsSync(output), true)
  assert.equal(existsSync(join(output, 'index.html')), true)
  rmSync(root, { recursive: true, force: true })
})

test('moves a directory only when a nested output directory is blocked', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-build-output-blocked-'))
  const output = join(root, 'dist')
  const blocked = join(output, 'assets')
  mkdirSync(blocked, { recursive: true })
  chmodSync(blocked, 0o555)

  prepareBuildOutput(output)

  assert.equal(existsSync(output), false)
  assert.equal(existsSync(`${output}.previous-${process.pid}`), true)
  rmSync(root, { recursive: true, force: true })
})

test('fails closed for a symlinked build output', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-build-output-link-'))
  const target = join(root, 'target')
  const output = join(root, 'dist')
  mkdirSync(target)
  symlinkSync(target, output)

  assert.throws(() => prepareBuildOutput(output), /real directory/)
  assert.equal(existsSync(output), true)
  rmSync(root, { recursive: true, force: true })
})

test('fails closed for nested symlinks before any output relocation', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-build-output-nested-link-'))
  const output = join(root, 'dist')
  const target = join(root, 'target')
  mkdirSync(output)
  mkdirSync(target)
  symlinkSync(target, join(output, 'assets'))

  assert.throws(() => prepareBuildOutput(output), /unsafe symlink/)
  assert.equal(existsSync(output), true)
  rmSync(root, { recursive: true, force: true })
})

test('does not inspect dist when an alternate outDir is supplied', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-build-output-alternate-'))
  const output = join(root, 'dist')
  const target = join(root, 'target')
  mkdirSync(output)
  mkdirSync(target)
  symlinkSync(target, join(output, 'assets'))

  const script = fileURLToPath(new URL('./prepare-build-output.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [script, '--outDir=/tmp/ftb-alternate'], { cwd: root, encoding: 'utf8' })

  assert.equal(result.status, 0)
  assert.equal(existsSync(output), true)
  rmSync(root, { recursive: true, force: true })
})
