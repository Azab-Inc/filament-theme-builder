import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import ts from 'typescript'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const defaultBaseline = { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }

export function validateTypeScriptSource(filename, source) {
  if (/^\s*\/\/\s*@ts-(?:ignore|nocheck)\b/m.test(source)) throw new Error(`Changed TypeScript file uses a suppression directive: ${filename}`)
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true)
  if (file.parseDiagnostics.length) throw new Error(`Changed TypeScript file has syntax errors: ${filename}`)
  return collectViolations(file)
}

export function validateChangedTypeScript(filename, source, baseline = defaultBaseline) {
  const current = validateTypeScriptSource(filename, source)
  if (filename.includes('/__tests__/')) return current
  if (current.any > baseline.any) throw new Error(`Changed TypeScript file adds explicit any: ${filename}`)
  if (current.unsafeNever > baseline.unsafeNever) throw new Error(`Changed TypeScript file adds unchecked as never: ${filename}`)
  if (current.unannotatedDeclarations > baseline.unannotatedDeclarations) throw new Error(`Changed TypeScript file adds unannotated declarations: ${filename}`)
  return current
}

export function getChangedPaths(baseRef = process.env.FTB_BASE_REF || 'HEAD^') {
  const branchPaths = gitNames(['diff', '--name-only', '--diff-filter=ACMR', `${resolveBaseRef(baseRef)}...HEAD`])
  const worktreePaths = [
    ...gitNames(['diff', '--name-only', '--diff-filter=ACMR']),
    ...gitNames(['diff', '--cached', '--name-only', '--diff-filter=ACMR']),
    ...gitNames(['ls-files', '--others', '--exclude-standard']),
  ]
  return [...new Set([...branchPaths, ...worktreePaths])]
    .filter((name) => name.startsWith('builder/src/') && name.endsWith('.ts') && !name.endsWith('.d.ts'))
}

export function runStandardsGuard() {
  const baseRef = process.env.FTB_BASE_REF || 'HEAD^'
  const baselineRef = process.env.FTB_STANDARDS_BASELINE_REF || resolveBaseRef(baseRef)
  const names = getChangedPaths(baseRef)
  const violations = []
  for (const filename of names) {
    const current = readFileSync(join(repositoryRoot, filename), 'utf8')
    const baseline = readBaseline(filename, baselineRef)
    try {
      validateChangedTypeScript(filename, current, baseline)
    } catch (error) {
      violations.push(error instanceof Error ? error.message : String(error))
    }
  }
  if (violations.length) throw new Error(`Changed-code standards violations:\n${violations.join('\n')}`)
  console.log(`Checked ${names.length} changed builder TypeScript file(s) with the TypeScript compiler API.`)
  return names.length
}

export function resolveBaseRef(baseRef) {
  const resolved = gitNames(['rev-parse', '--verify', baseRef])[0]
  const head = gitNames(['rev-parse', 'HEAD'])[0]
  return resolved === head ? 'HEAD^' : baseRef
}

function readBaseline(filename, baselineRef) {
  try {
    const source = execFileSync('git', ['show', `${baselineRef}:${filename}`], { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return collectViolations(ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true))
  } catch {
    return defaultBaseline
  }
}

function gitNames(argumentsList) {
  return execFileSync('git', argumentsList, { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .filter(Boolean)
}

function collectViolations(file) {
  const violations = { any: 0, unsafeNever: 0, unannotatedDeclarations: 0 }
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) violations.any += 1
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.NeverKeyword) violations.unsafeNever += 1
    if (ts.isVariableDeclaration(node) && node.initializer && !node.type) violations.unannotatedDeclarations += 1
    ts.forEachChild(node, visit)
  }
  visit(file)
  return violations
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runStandardsGuard()
