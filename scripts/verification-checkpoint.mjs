import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repositoryRoot = process.cwd()
const checkpointFilename = 'ftb-verification-checkpoint.json'
const fullUnitTimeoutMs = 20_000
const signalExitCodes = { SIGINT: 130, SIGTERM: 143, SIGKILL: 137 }

export function relevantPaths(cwd, base) {
  const baseline = gitNames(['ls-tree', '-r', '--name-only', base], cwd)
  const current = [...new Set([...gitNames(['ls-files'], cwd), ...gitNames(['ls-files', '--others', '--exclude-standard'], cwd)])]
  return [...new Set([...baseline, ...current])].filter(isRelevantPath).sort()
}

export function isRelevantPath(path) {
  return path === 'Jenkinsfile' || path === 'Dockerfile' || path === 'Dockerfile.dev' || path === 'playwright.config.ts' || path.startsWith('tsconfig') || path.startsWith('phpunit') || path === 'package.json' || path === 'package-lock.json' || path === 'builder/package.json' || path === 'builder/package-lock.json' || path.startsWith('builder/tsconfig') || path === 'builder/vite.config.ts' || path === 'builder/vitest.config.ts' || path === 'demo/composer.json' || path === 'demo/composer.lock' || path.startsWith('demo/package') || path.startsWith('demo/app/') || path.startsWith('demo/config/') || path.startsWith('demo/resources/') || path.startsWith('demo/database/') || path.startsWith('demo/routes/') || path.startsWith('demo/tests/') || path.startsWith('compose.') || path.startsWith('docker/') || path.startsWith('builder/src/') || path.startsWith('builder/scripts/') || (path.startsWith('e2e/') && path.endsWith('.ts')) || path.startsWith('scripts/')
}

export function computePatchIdentity(paths, readFile) {
  const hash = createHash('sha256')
  for (const path of [...new Set(paths)].filter(isRelevantPath).sort()) hash.update(path).update('\0').update(readFile(path)).update('\0')
  return hash.digest('hex')
}

export function computeWorkingIdentity({ cwd, base }) {
  const hash = createHash('sha256')
  for (const path of relevantPaths(cwd, base)) {
    const baseline = gitContent(cwd, base, path)
    const current = existsSync(`${cwd}/${path}`) ? readFileSync(`${cwd}/${path}`) : Buffer.from('<deleted>')
    hash.update(path).update('\0').update(baseline).update('\0').update(current).update('\0')
  }
  return hash.digest('hex')
}

export function isStaleCheckpoint(expectedIdentity, currentIdentity) {
  return expectedIdentity !== currentIdentity
}

export function createCheckpoint(options = {}) {
  const cwd = options.cwd ?? repositoryRoot
  const storagePath = options.storagePath ?? defaultStoragePath(cwd)
  const base = options.base ?? readCheckpoint(storagePath)?.base ?? gitNames(['rev-parse', 'HEAD'], cwd)[0]
  const checkpoint = { base, patchIdentity: computeWorkingIdentity({ cwd, base }), completed: false, success: false, commands: [], expectedCommandCount: 0 }
  writeFileSync(storagePath, `${JSON.stringify(checkpoint, null, 2)}\n`)
  return checkpoint
}

export function runVerification({ patchIdentity, currentPatchIdentity = () => patchIdentity, commands, runner = execFileSync }) {
  const results = []
  for (const entry of commands) {
    const command = [entry.command, ...entry.args].join(' ')
    let exit = 0
    let signal
    try {
      runner(entry.command, entry.args, { cwd: entry.cwd, stdio: 'inherit', env: { ...process.env, ...entry.env } })
    } catch (error) {
      signal = error?.signal
      exit = typeof error?.status === 'number' ? error.status : signalExitCodes[signal] ?? 1
    }
    results.push({ command, cwd: entry.cwd, exit, ...(signal ? { signal } : {}) })
    if (exit !== 0) break
  }
  const endIdentity = currentPatchIdentity()
  return { patchIdentity, endIdentity, stale: isStaleCheckpoint(patchIdentity, endIdentity), commands: results }
}

export function verificationCommands() {
  const timeout = String(fullUnitTimeoutMs)
  return [
    { command: 'npm', args: ['run', 'lint:changed'], cwd: '.' },
    { command: 'node', args: ['--test', 'builder/scripts/changed-code-standards.test.mjs', 'scripts/changed-code-check.test.mjs', 'scripts/verification-checkpoint.test.mjs', 'scripts/jenkins-contract.test.mjs'], cwd: '.' },
    { command: 'npm', args: ['--prefix', 'builder', 'run', 'test:unit', '--', '--run', `--testTimeout=${timeout}`, `--hookTimeout=${timeout}`], cwd: '.' },
    { command: 'npm', args: ['--prefix', 'builder', 'run', 'type-check'], cwd: '.' },
    { command: 'npm', args: ['--prefix', 'builder', 'run', 'build'], cwd: '.' },
    { command: 'composer', args: ['--working-dir=demo', 'test'], cwd: '.' },
    { command: 'node', args: ['scripts/verification-checkpoint.mjs', 'browser'], cwd: '.', env: { COMPOSE_E2E: '1' } },
  ]
}

export function browserCommands() {
  const env = { COMPOSE_E2E: '1' }
  return [
    { command: 'npx', args: ['playwright', 'test', 'e2e/ftb-007-bridge.spec.ts', 'e2e/ftb-182-unique-element-id.spec.ts', '--reporter=line'], cwd: '.', env },
    { command: 'npx', args: ['playwright', 'test', 'e2e/demo-showcase.spec.ts', '--grep', 'tables showcase', '--reporter=line'], cwd: '.', env },
    { command: 'npx', args: ['playwright', 'test', 'e2e/theme-foundations.spec.ts', '--grep', 'changes native Products, Orders, and Inventory table density immediately without requests', '--reporter=line'], cwd: '.', env },
    { command: 'npx', args: ['playwright', 'test', 'e2e/foundation-density-regression.spec.ts', 'e2e/ftb-012-density-mcp.spec.ts', '--reporter=line'], cwd: '.', env },
  ]
}

export function checkCheckpoint(options = {}) {
  const cwd = options.cwd ?? repositoryRoot
  const storagePath = options.storagePath ?? defaultStoragePath(cwd)
  const checkpoint = readCheckpoint(storagePath)
  if (!checkpoint) return { ok: false, reason: 'missing_checkpoint' }
  const currentIdentity = computeWorkingIdentity({ cwd, base: checkpoint.base })
  const complete = checkpoint.completed === true && checkpoint.success === true && checkpoint.commands.length === checkpoint.expectedCommandCount && checkpoint.expectedCommandCount > 0 && checkpoint.commands.every(({ exit }) => exit === 0) && checkpoint.endIdentity === checkpoint.patchIdentity
  return { ok: complete && !isStaleCheckpoint(checkpoint.patchIdentity, currentIdentity), base: checkpoint.base, patchIdentity: checkpoint.patchIdentity, currentIdentity, complete }
}

function readCheckpoint(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
}

function gitContent(cwd, base, path) {
  try { return execFileSync('git', ['show', `${base}:${path}`], { cwd, stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return Buffer.from('<absent>') }
}

export function defaultStoragePath(cwd = repositoryRoot) {
  const gitPath = execFileSync('git', ['rev-parse', '--git-path', checkpointFilename], { cwd, encoding: 'utf8' }).trim()
  return resolve(cwd, gitPath)
}

function gitNames(args, cwd = repositoryRoot) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).split('\n').filter(Boolean)
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const mode = process.argv[2] ?? 'run'
  if (mode === 'identity') {
    const existing = readCheckpoint(defaultStoragePath())
    const base = existing?.base ?? gitNames(['rev-parse', 'HEAD'], repositoryRoot)[0]
    console.log(JSON.stringify({ base, patchIdentity: computeWorkingIdentity({ cwd: repositoryRoot, base }) }, null, 2))
  } else if (mode === 'check') {
    const result = checkCheckpoint()
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.ok ? 0 : 2
  } else if (mode === 'browser') {
    const evidence = runVerification({ patchIdentity: 'browser', commands: browserCommands() })
    process.exitCode = evidence.commands.at(-1)?.exit ?? 0
  } else if (mode === 'profile') {
    if (process.argv[3] === 'unit-timeout') console.log(fullUnitTimeoutMs)
    else console.log(JSON.stringify({ fullUnitTimeoutMs, browserCommands: browserCommands().map(({ command, args }) => [command, ...args]) }))
  } else {
    const existing = readCheckpoint(defaultStoragePath())
    const base = existing?.base ?? gitNames(['rev-parse', 'HEAD'], repositoryRoot)[0]
    const initial = { base, patchIdentity: computeWorkingIdentity({ cwd: repositoryRoot, base }) }
    const evidence = runVerification({ patchIdentity: initial.patchIdentity, currentPatchIdentity: () => computeWorkingIdentity({ cwd: repositoryRoot, base: initial.base }), commands: verificationCommands() })
    const final = { ...initial, ...evidence }
    if (!evidence.stale && evidence.commands.length === verificationCommands().length && evidence.commands.every(({ exit }) => exit === 0)) writeFileSync(defaultStoragePath(), `${JSON.stringify({ ...final, completed: true, success: true, expectedCommandCount: evidence.commands.length }, null, 2)}\n`)
    console.log(JSON.stringify(final, null, 2))
    process.exitCode = evidence.stale ? 2 : evidence.commands.at(-1)?.exit ?? 0
  }
}
