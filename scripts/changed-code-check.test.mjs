import assert from 'node:assert/strict'
import test from 'node:test'
import { buildChangedPhpPintArgs, runChangedPhpPint } from './changed-code-check.mjs'

test('keeps changed PHP filename boundaries and skips unrelated files', () => {
  assert.deepEqual(buildChangedPhpPintArgs(['demo/app/Example.php', 'demo/app/view.blade.php', 'e2e/example.ts'], () => true), ['--test', 'app/Example.php', 'app/view.blade.php'])
  assert.deepEqual(buildChangedPhpPintArgs(['demo/package.json']), null)
})

test('skips Pint with no changed PHP files', () => {
  const calls = []
  const result = runChangedPhpPint(['builder/src/App.vue'], (command, args, options) => calls.push({ command, args, options }))
  assert.equal(result, 'skipped')
  assert.deepEqual(calls, [])
})

test('invokes Pint once for changed PHP and propagates failures', () => {
  const calls = []
  assert.throws(() => runChangedPhpPint(['demo/app/Example.php'], (command, args, options) => {
    calls.push({ command, args, options })
    throw new Error('pint failed')
  }, () => true), /pint failed/)
  assert.deepEqual(calls, [{ command: 'vendor/bin/pint', args: ['--test', 'app/Example.php'], options: { cwd: 'demo', stdio: 'inherit' } }])
})

test('skips deleted PHP paths before invoking Pint', () => {
  const calls = []
  const result = runChangedPhpPint(['demo/app/deleted.php', 'demo/app/Example.php'], (command, args, options) => calls.push({ command, args, options }), (path) => path.endsWith('Example.php'))
  assert.equal(result, 'passed')
  assert.deepEqual(calls[0].args, ['--test', 'app/Example.php'])
})
