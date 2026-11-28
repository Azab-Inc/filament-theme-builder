import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

test('guards function signatures, constructors, and callback context', () => {
  assert.throws(() => validateChangedTypeScript('signature.ts', 'class Example { constructor(value) {} }', { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }), /unannotated parameters/)
  assert.throws(() => validateChangedTypeScript('callback.ts', 'const callback: () => number = () => 1', { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }), /unannotated returns/)
})

test('keeps violation categories independent when legacy debt is removed', () => {
  assert.throws(() => validateChangedTypeScript('mixed.ts', 'const value: any = 1', { any: 0, unsafeNever: 0, unannotatedDeclarations: 1 }), /explicit any/)
  const baseline = validateTypeScriptSource('builder/src/utils/legacy.ts', "import { ref } from 'vue'\nconst oldValue: any = ref(1)")
  assert.throws(() => validateChangedTypeScript('builder/src/utils/legacy.ts', "import { useTheme } from '@/composables/use-theme'\nconst newValue: any = useTheme()", baseline), /introduces/)
  const duplicateBaseline = validateTypeScriptSource('duplicate.ts', 'const value: any = 1')
  assert.throws(() => validateChangedTypeScript('duplicate.ts', 'const value: any = 1\nconst value: any = 1', duplicateBaseline), /introduces/)
})

test('keeps an unchanged unsafe cast stable when neighboring function statements change', () => {
  const baseline = validateTypeScriptSource('stable.ts', 'function parse(input: unknown): unknown {\n  const value: unknown = input as never\n  const neighbor: number = 1\n  return value\n}')
  assert.doesNotThrow(() => validateChangedTypeScript('stable.ts', 'function parse(input: unknown): unknown {\n  const value: unknown = input as never\n  const neighbor: number = 2\n  return value\n}', baseline))
  assert.throws(() => validateChangedTypeScript('stable.ts', 'function parse(input: unknown): unknown {\n  const value: unknown = input as never\n  const neighbor: number = 2\n  const added: unknown = other as never\n  return value\n}', baseline), /introduces/)
})

test('parses Vue SFC script blocks without treating templates as TypeScript', () => {
  const baseline = validateTypeScriptSource('Component.vue', '<script setup lang="ts">const value: number = 1</script><template>{{ value }}</template>')
  assert.doesNotThrow(() => validateChangedTypeScript('Component.vue', '<script setup lang="ts">const value: number = 1</script><template>{{ value + 1 }}</template>', baseline))
  assert.throws(() => validateChangedTypeScript('Component.vue', '<script setup lang="ts">const value = 1</script><template>{{ value }}</template>', baseline), /introduces/)
})

test('accepts legal bodyless declarations without crashing', () => {
  assert.doesNotThrow(() => validateTypeScriptSource('overload.ts', 'function overloaded(value: string): string\nfunction overloaded(value: number): number'))
})

test('discovers only changed TypeScript E2E sources', () => {
  const root = mkdtempSync(join(tmpdir(), 'ftb-guard-'))
  try {
    execFileSync('git', ['init', '-q'], { cwd: root }); execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root }); execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root })
    mkdirSync(join(root, 'builder/src'), { recursive: true }); mkdirSync(join(root, 'e2e'), { recursive: true })
    writeFileSync(join(root, 'builder/src/base.ts'), 'const value: number = 1'); writeFileSync(join(root, 'builder/src/component.vue'), '<template>{{ value }}</template>')
    writeFileSync(join(root, 'e2e/base.ts'), 'const value: number = 1'); writeFileSync(join(root, 'e2e/image.png'), 'not an image'); writeFileSync(join(root, 'e2e/data.json'), '{}')
    execFileSync('git', ['add', '.'], { cwd: root }); execFileSync('git', ['commit', '-qm', 'base'], { cwd: root })
    writeFileSync(join(root, 'builder/src/base.ts'), 'const value: number = 2'); writeFileSync(join(root, 'e2e/staged.ts'), 'const value: number = 2'); execFileSync('git', ['add', 'e2e/staged.ts'], { cwd: root })
    writeFileSync(join(root, 'e2e/untracked.ts'), 'const value: number = 3'); rmSync(join(root, 'builder/src/component.vue'))
    const paths = getChangedPaths('HEAD', root)
    assert.deepEqual(paths.sort(), ['builder/src/base.ts', 'builder/src/component.vue', 'e2e/staged.ts', 'e2e/untracked.ts'])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('applies the declaration guard to tests and e2e sources', () => {
  assert.throws(() => validateChangedTypeScript('builder/src/__tests__/new.spec.ts', 'const value = 1', { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }), /unannotated declarations/)
  assert.throws(() => validateChangedTypeScript('e2e/new.spec.ts', 'const value = 1', { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }), /unannotated declarations/)
})

test('rejects Vue and composable dependencies from utility modules', () => {
  assert.throws(() => validateChangedTypeScript('builder/src/utils/new-util.ts', "import { ref } from 'vue'\nconst value: number = 1", { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }), /utility module cannot depend on Vue or composables/)
  assert.throws(() => validateChangedTypeScript('builder/src/utils/new-util.ts', "import { useTheme } from '@/composables/use-theme'\nconst value: number = 1", { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }), /utility module cannot depend on Vue or composables/)
})
