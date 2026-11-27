import test from 'node:test'
import assert from 'node:assert/strict'
const { getChangedPaths, resolveBaseRef, validateChangedTypeScript, validateTypeScriptSource } = await import('./changed-code-standards.mjs')

test('imports without executing the repository guard', () => {
  assert.equal(typeof getChangedPaths, 'function')
})

test('falls back from a base that is already HEAD', () => {
  assert.equal(resolveBaseRef('HEAD'), 'HEAD^')
})

test('accepts valid changed TypeScript', () => {
  assert.doesNotThrow(() => validateTypeScriptSource('positive.ts', 'const value: string = "ok"'))
})

test('rejects suppression directives in changed TypeScript', () => {
  assert.throws(() => validateTypeScriptSource('negative.ts', '// @ts-ignore\nconst value = 1'), /suppression directive/)
})

test('rejects syntax errors in changed TypeScript', () => {
  assert.throws(() => validateTypeScriptSource('negative-syntax.ts', 'const value = ;'), /syntax errors/)
})

test('rejects newly introduced any, unchecked never, and unannotated declarations', () => {
  assert.throws(() => validateChangedTypeScript('negative-any.ts', 'const value: any = 1', { any: 0, unsafeNever: 0, unannotatedDeclarations: 1 }), /explicit any/)
  assert.throws(() => validateChangedTypeScript('negative-never.ts', 'const value = input as never', { any: 0, unsafeNever: 0, unannotatedDeclarations: 1 }), /unchecked as never/)
  assert.throws(() => validateChangedTypeScript('negative-declaration.ts', 'const value = 1', { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }), /unannotated declarations/)
})
