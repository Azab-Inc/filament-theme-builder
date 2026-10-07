import { spawnSync } from 'node:child_process'
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hasApplicationKey, repositoryRoot } from './setup-utils.mjs'

const root = repositoryRoot(import.meta.url)
const demo = resolve(root, 'demo')

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })

  if (result.error?.code === 'ENOENT') {
    throw new Error(`Required tool "${command}" was not found. Install it and ensure it is on PATH.`)
  }
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`Command "${command} ${args.join(' ')}" failed with exit code ${result.status}.`)
  }
}

function requireFile(path, description) {
  if (!existsSync(path)) throw new Error(`Required ${description} is missing: ${path}.`)
}

function ensureEnvironmentFile() {
  const envFile = resolve(demo, '.env')
  if (existsSync(envFile)) return envFile

  const exampleFile = resolve(demo, '.env.example')
  requireFile(exampleFile, 'demo environment template')

  copyFileSync(exampleFile, envFile, 0)
  return envFile
}

function ensureSqliteDatabase() {
  const databaseDirectory = resolve(demo, 'database')
  mkdirSync(databaseDirectory, { recursive: true })

  const databaseFile = resolve(databaseDirectory, 'database.sqlite')
  if (existsSync(databaseFile)) return

  try {
    closeSync(openSync(databaseFile, 'wx'))
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

function setup() {
  requireFile(resolve(root, 'package-lock.json'), 'root npm lockfile')
  requireFile(resolve(root, 'builder/package-lock.json'), 'builder npm lockfile')
  requireFile(resolve(demo, 'package-lock.json'), 'demo npm lockfile')
  requireFile(resolve(demo, 'composer.lock'), 'demo Composer lockfile')
  requireFile(resolve(demo, '.env.example'), 'demo environment template')

  run('npm', ['ci'], resolve(root, 'builder'))
  run('npm', ['ci'], demo)

  const envFile = ensureEnvironmentFile()
  ensureSqliteDatabase()

  run('composer', ['install', '--no-interaction', '--prefer-dist'], demo)

  if (!hasApplicationKey(readFileSync(envFile, 'utf8'))) {
    run('php', ['artisan', 'key:generate', '--force'], demo)
  }

  run('php', ['artisan', 'migrate', '--force'], demo)
}

try {
  setup()
} catch (error) {
  console.error(`Setup failed: ${error.message}`)
  process.exitCode = 1
}
