import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import ts from 'typescript'
import { parse as parseVueSfc } from '@vue/compiler-sfc'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const defaultBaseline = { any: 0, unsafeNever: 0, unannotatedDeclarations: 0, unannotatedParameters: 0, unannotatedReturns: 0 }

export function validateTypeScriptSource(filename, source) {
  if (/^\s*\/\/\s*@ts-(?:ignore|nocheck)\b/m.test(source)) throw new Error(`Changed TypeScript file uses a suppression directive: ${filename}`)
  const file = parseSourceFile(filename, source)
  if (file.parseDiagnostics.length) throw new Error(`Changed TypeScript file has syntax errors: ${filename}`)
  const violations = collectViolations(file, file.text)
  if (isUtilityModule(filename) && importsVueOrComposable(file)) {
    violations.utilityDependencies = 1
    violations.identities.push({ kind: 'utility-dependency', identity: `utility-dependency:${utilityImportIdentity(file)}` })
  }
  return violations
}

export function validateChangedTypeScript(filename, source, baseline = defaultBaseline) {
  const current = validateTypeScriptSource(filename, source)
  if (baseline.identities) {
    const legacy = new Map()
    baseline.identities.forEach(({ identity }) => legacy.set(identity, (legacy.get(identity) ?? 0) + 1))
    const introduced = current.identities.filter(({ identity }) => {
      const count = legacy.get(identity) ?? 0
      if (count === 0) return true
      legacy.set(identity, count - 1)
      return false
    })
    if (introduced.length) throw new Error(`Changed TypeScript file introduces ${introduced[0].kind}: ${filename}`)
    return current
  }
  if (current.any > baseline.any) throw new Error(`Changed TypeScript file adds explicit any: ${filename}`)
  if (current.unsafeNever > baseline.unsafeNever) throw new Error(`Changed TypeScript file adds unchecked as never: ${filename}`)
  if (current.unannotatedDeclarations > baseline.unannotatedDeclarations) throw new Error(`Changed TypeScript file adds unannotated declarations: ${filename}`)
  if (current.unannotatedParameters > (baseline.unannotatedParameters ?? 0)) throw new Error(`Changed TypeScript file adds unannotated parameters: ${filename}`)
  if (current.unannotatedReturns > (baseline.unannotatedReturns ?? 0)) throw new Error(`Changed TypeScript file adds unannotated returns: ${filename}`)
  if (current.utilityDependencies > (baseline.utilityDependencies ?? 0)) throw new Error(`Changed utility module cannot depend on Vue or composables: ${filename}`)
  return current
}

export function getChangedPaths(baseRef = process.env.FTB_BASE_REF || 'HEAD^', cwd = repositoryRoot) {
  const branchPaths = safeGitNames(['diff', '--name-only', '--diff-filter=ACMRD', `${resolveBaseRef(baseRef, cwd)}...HEAD`], cwd)
  const worktreePaths = [
    ...gitNames(['diff', '--name-only', '--diff-filter=ACMRD'], cwd),
    ...gitNames(['diff', '--cached', '--name-only', '--diff-filter=ACMRD'], cwd),
    ...gitNames(['ls-files', '--others', '--exclude-standard'], cwd),
  ]
  return [...new Set([...branchPaths, ...worktreePaths])]
    .filter((name) => ((name.startsWith('builder/src/') && (name.endsWith('.ts') || name.endsWith('.vue'))) || (name.startsWith('e2e/') && name.endsWith('.ts'))) && !name.endsWith('.d.ts'))
}

export function runStandardsGuard() {
  const baseRef = process.env.FTB_BASE_REF || 'HEAD^'
  const baselineRef = process.env.FTB_STANDARDS_BASELINE_REF || resolveBaseRef(baseRef)
  const names = getChangedPaths(baseRef)
  const violations = []
  for (const filename of names) {
    if (!existsSync(join(repositoryRoot, filename))) continue
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

export function resolveBaseRef(baseRef, cwd = repositoryRoot) {
  const resolved = gitNames(['rev-parse', '--verify', baseRef], cwd)[0]
  const head = gitNames(['rev-parse', 'HEAD'], cwd)[0]
  return resolved === head ? 'HEAD^' : baseRef
}

export function readBaseline(filename, baselineRef) {
  try {
    const source = execFileSync('git', ['show', `${baselineRef}:${filename}`], { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const file = parseSourceFile(filename, source)
    const violations = collectViolations(file, file.text)
    if (isUtilityModule(filename) && importsVueOrComposable(file)) {
      violations.utilityDependencies = 1
      violations.identities.push({ kind: 'utility-dependency', identity: `utility-dependency:${utilityImportIdentity(file)}` })
    }
    return violations
  } catch {
    return defaultBaseline
  }
}

function gitNames(argumentsList, cwd = repositoryRoot) {
  return execFileSync('git', argumentsList, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .filter(Boolean)
}

function safeGitNames(argumentsList, cwd) {
  try { return gitNames(argumentsList, cwd) } catch { return [] }
}

function collectViolations(file, source) {
  const violations = { any: 0, unsafeNever: 0, unannotatedDeclarations: 0, unannotatedParameters: 0, unannotatedReturns: 0, utilityDependencies: 0 }
  violations.identities = []
  const record = (kind, node) => violations.identities.push({ kind, identity: `${kind}:${nodeContext(node, file, source)}` })
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) { violations.any += 1; record('explicit-any', node) }
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.NeverKeyword) { violations.unsafeNever += 1; record('unsafe-never', node) }
    if (ts.isVariableDeclaration(node) && node.initializer && !node.type) { violations.unannotatedDeclarations += 1; record('unannotated-declaration', node) }
    if (ts.isParameter(node) && !node.type) { violations.unannotatedParameters += 1; record('unannotated-parameter', node) }
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && !node.type) { violations.unannotatedReturns += 1; record('unannotated-return', node) }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return violations
}

function extractVueScript(source) {
  const parsed = parseVueSfc(source)
  if (parsed.errors.length) throw new Error('Changed Vue file has SFC parse errors')
  return [parsed.descriptor.script?.content ?? '', parsed.descriptor.scriptSetup?.content ?? ''].join('\n')
}

function nodeContext(node, file, source) {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return functionSignature(node, file, source)
  let current = node
  while (current.parent && current.parent !== file) {
    if (ts.isFunctionDeclaration(current.parent) || ts.isMethodDeclaration(current.parent) || ts.isFunctionExpression(current.parent) || ts.isArrowFunction(current.parent)) return functionSignature(current.parent, file, source)
    if (ts.isVariableDeclaration(current.parent) || ts.isParameter(current.parent) || ts.isImportDeclaration(current.parent) || ts.isFunctionDeclaration(current.parent) || ts.isMethodDeclaration(current.parent) || ts.isExpressionStatement(current.parent)) current = current.parent
    else if (ts.isVariableDeclaration(current) || ts.isParameter(current) || ts.isImportDeclaration(current) || ts.isFunctionDeclaration(current) || ts.isMethodDeclaration(current) || ts.isExpressionStatement(current)) break
    else { current = current.parent; continue }
    if (ts.isVariableDeclaration(current) || ts.isParameter(current) || ts.isImportDeclaration(current) || ts.isFunctionDeclaration(current) || ts.isMethodDeclaration(current) || ts.isExpressionStatement(current)) break
  }
  return source.slice(current.getStart(file), current.getEnd())
}

function functionSignature(node, file, source) {
  return source.slice(node.getStart(file), node.body ? node.body.getStart(file) : node.getEnd())
}

function parseSourceFile(filename, source) {
  const parsedSource = filename.endsWith('.vue') ? extractVueScript(source) : source
  return ts.createSourceFile(filename, parsedSource, ts.ScriptTarget.Latest, true)
}

function isUtilityModule(filename) {
  return filename.includes('/src/utils/')
}

function importsVueOrComposable(file) {
  return file.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return false
    const moduleName = statement.moduleSpecifier.text
    return moduleName === 'vue' || moduleName.includes('/composables/') || moduleName.startsWith('@/composables/')
  })
}

function utilityImportIdentity(file) {
  return file.statements.filter((statement) => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)).map((statement) => statement.moduleSpecifier.text).filter((moduleName) => moduleName === 'vue' || moduleName.includes('/composables/') || moduleName.startsWith('@/composables/')).sort().join('|')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runStandardsGuard()
