import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { browserCommands, checkCheckpoint, computePatchIdentity, createCheckpoint, defaultStoragePath, isRelevantPath, isStaleCheckpoint, runVerification, verificationCommands } from './verification-checkpoint.mjs'

test('patch identity includes relevant tracked and untracked files but excludes docs and outputs', () => {
  const files = ['builder/src/App.vue', 'scripts/verification-checkpoint.mjs', 'docs/notes.md', 'artifacts/result.json']
  const contents = new Map(files.map((file) => [file, file]))
  const identity = computePatchIdentity(files, (file) => contents.get(file) ?? '')
  assert.equal(identity, computePatchIdentity(['builder/src/App.vue', 'scripts/verification-checkpoint.mjs'], (file) => contents.get(file) ?? ''))
})

test('checkpoint rejects stale evidence after a meaningful source edit', () => {
  assert.equal(isStaleCheckpoint('abc', 'abc'), false)
  assert.equal(isStaleCheckpoint('abc', 'def'), true)
})

test('identity is stable across staging, commit, and documentation/output edits but records deletions', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-checkpoint-'))
  try {
    execFileSync('git', ['init', '-q'], { cwd: root }); execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root }); execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root })
    mkdirSync(join(root, 'builder/src'), { recursive: true }); writeFileSync(join(root, 'builder/src/a.ts'), 'const value = 1'); writeFileSync(join(root, 'package-lock.json'), '{}'); writeFileSync(join(root, 'README.md'), 'docs')
    execFileSync('git', ['add', '.'], { cwd: root }); execFileSync('git', ['commit', '-qm', 'base'], { cwd: root })
    const storagePath = join(root, '.git', 'ftb-verification-checkpoint.json')
    const first = createCheckpoint({ cwd: root, storagePath })
    mkdirSync(join(root, 'demo/app'), { recursive: true }); mkdirSync(join(root, 'demo/tests'), { recursive: true }); writeFileSync(join(root, 'demo/app/Example.php'), '<?php echo 1;'); writeFileSync(join(root, 'demo/tests/ExampleTest.php'), '<?php echo 1;'); writeFileSync(join(root, 'Dockerfile'), 'FROM node'); writeFileSync(join(root, 'phpunit.xml'), '<phpunit/>')
    writeFileSync(join(root, 'builder/src/a.ts'), 'const value = 2'); writeFileSync(join(root, 'README.md'), 'changed docs'); writeFileSync(join(root, 'artifacts-output.txt'), 'output')
    const second = createCheckpoint({ cwd: root, storagePath, base: first.base })
    execFileSync('git', ['add', 'builder/src/a.ts'], { cwd: root }); execFileSync('git', ['commit', '-qm', 'feature'], { cwd: root })
    const committed = createCheckpoint({ cwd: root, storagePath, base: first.base })
    assert.equal(second.patchIdentity, committed.patchIdentity)
    assert.equal(isRelevantPath('demo/app/Example.php'), true)
    assert.equal(isRelevantPath('demo/tests/ExampleTest.php'), true)
    assert.equal(isRelevantPath('Dockerfile'), true)
    assert.equal(isRelevantPath('phpunit.xml'), true)
    assert.equal(isRelevantPath('Dockerfile.dev'), true)
    assert.equal(isRelevantPath('docker/demo/start.sh'), true)
    assert.equal(isRelevantPath('demo/resources/views/example.blade.php'), true)
    assert.equal(isRelevantPath('demo/database/seeders/ExampleSeeder.php'), true)
    assert.equal(isRelevantPath('demo/routes/web.php'), true)
    assert.equal(isRelevantPath('README.md'), false)
    unlinkSync(join(root, 'builder/src/a.ts'))
    const deleted = createCheckpoint({ cwd: root, storagePath, base: first.base })
    assert.notEqual(deleted.patchIdentity, committed.patchIdentity)
    assert.match(readFileSync(storagePath, 'utf8'), /"base"/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('checkpoint state requires a complete successful latest record', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-checkpoint-state-'))
  try {
    execFileSync('git', ['init', '-q'], { cwd: root }); execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root }); execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root })
    mkdirSync(join(root, 'builder/src'), { recursive: true }); writeFileSync(join(root, 'builder/src/a.ts'), 'const value = 1'); execFileSync('git', ['add', '.'], { cwd: root }); execFileSync('git', ['commit', '-qm', 'base'], { cwd: root })
    const path = defaultStoragePath(root); assert.equal(checkCheckpoint({ cwd: root, storagePath: path }).ok, false)
    const cli = fileURLToPath(new URL('./verification-checkpoint.mjs', import.meta.url))
    assert.throws(() => execFileSync(process.execPath, [cli, 'check'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }))
    const incomplete = createCheckpoint({ cwd: root, storagePath: path })
    assert.equal(checkCheckpoint({ cwd: root, storagePath: path }).ok, false)
    writeFileSync(path, JSON.stringify({ ...incomplete, completed: true, success: false, commands: [{ exit: 1 }], expectedCommandCount: 1 }))
    assert.equal(checkCheckpoint({ cwd: root, storagePath: path }).ok, false)
    writeFileSync(path, JSON.stringify({ ...incomplete, completed: true, success: true, endIdentity: incomplete.patchIdentity, commands: [{ exit: 0 }], expectedCommandCount: 1 }))
    assert.equal(checkCheckpoint({ cwd: root, storagePath: path }).ok, true)
    assert.match(execFileSync(process.execPath, [cli, 'check'], { cwd: root, encoding: 'utf8' }), /"ok": true/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('checkpoint storage follows the git-private path', () => {
  assert.match(defaultStoragePath(process.cwd()), /ftb-verification-checkpoint\.json$/)
})

test('runner records command, cwd, and exit in order and binds the checkpoint identity', () => {
  const calls = []
  const result = runVerification({
    patchIdentity: 'abc',
    commands: [{ command: 'node', args: ['--version'], cwd: '.' }, { command: 'npm', args: ['run', 'type-check'], cwd: 'builder' }],
    runner: (command, args, options) => { calls.push({ command, args, options }); return 0 },
  })
  assert.equal(result.patchIdentity, 'abc')
  assert.deepEqual(result.commands.map(({ command, cwd, exit }) => ({ command, cwd, exit })), [
    { command: 'node --version', cwd: '.', exit: 0 },
    { command: 'npm run type-check', cwd: 'builder', exit: 0 },
  ])
  assert.equal(calls.length, 2)
})

test('runner detects concurrent edits at end-state and preserves failure signals', () => {
  let current = 'abc'
  const stale = runVerification({ patchIdentity: 'abc', currentPatchIdentity: () => current, commands: [{ command: 'node', args: ['ok'], cwd: '.' }], runner: () => { current = 'def' } })
  assert.equal(stale.stale, true)
  const signaled = runVerification({ patchIdentity: 'abc', currentPatchIdentity: () => 'abc', commands: [{ command: 'node', args: ['bad'], cwd: '.' }], runner: () => { const error = new Error('terminated'); error.signal = 'SIGTERM'; throw error } })
  assert.equal(signaled.commands[0].signal, 'SIGTERM')
  assert.equal(signaled.commands[0].exit, 143)
})

test('local profile selects exact inspector and table/density journeys', () => {
  const commands = browserCommands().map(({ args }) => args.join(' ')).join('\n')
  assert.match(commands, /ftb-007-bridge\.spec\.ts.*ftb-182-unique-element-id\.spec\.ts/)
  assert.match(commands, /demo-showcase\.spec\.ts.*--grep tables showcase/)
  assert.match(commands, /theme-foundations\.spec\.ts.*--grep changes native Products, Orders, and Inventory table density immediately without requests/)
  assert.match(commands, /foundation-density-regression\.spec\.ts.*ftb-012-density-mcp\.spec\.ts/)
  assert.doesNotMatch(commands, /demo-showcase\.spec\.ts e2e\/theme-foundations\.spec\.ts/)
  assert.match(verificationCommands().at(-1).args.join(' '), /verification-checkpoint\.mjs browser/)
})
