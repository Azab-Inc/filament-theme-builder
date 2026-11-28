import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function buildChangedPhpPintArgs(paths, fileExists = (path) => existsSync(join(process.cwd(), path))) {
  const phpFiles = paths.filter((path) => path.startsWith('demo/') && path.endsWith('.php') && fileExists(path))
  return phpFiles.length === 0 ? null : ['--test', ...phpFiles.map((path) => path.slice('demo/'.length))]
}

export function runChangedPhpPint(paths, runner = execFileSync, fileExists) {
  const args = buildChangedPhpPintArgs(paths, fileExists)
  if (args === null) return 'skipped'
  runner('vendor/bin/pint', args, { cwd: 'demo', stdio: 'inherit' })
  return 'passed'
}

export function changedPaths(baseRef = process.env.FTB_BASE_REF ?? 'HEAD^') {
  return [...new Set([
    ...gitNames(['diff', '--name-only', '--diff-filter=ACMRD', `${baseRef}...HEAD`]),
    ...gitNames(['diff', '--name-only', '--diff-filter=ACMRD']),
    ...gitNames(['diff', '--cached', '--name-only', '--diff-filter=ACMRD']),
    ...gitNames(['ls-files', '--others', '--exclude-standard']),
  ])]
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  execFileSync('node', ['builder/scripts/changed-code-standards.mjs'], { stdio: 'inherit' })
  const result = runChangedPhpPint(changedPaths())
  if (result === 'skipped') console.log('No changed demo PHP files; Pint check skipped.')
}

function gitNames(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean)
}
