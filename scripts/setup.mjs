import { spawnSync } from 'node:child_process'
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const demo = resolve(root, 'demo')

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npm', ['ci'], resolve(root, 'builder'))
run('npm', ['ci'], demo)
run('composer', ['install', '--no-interaction', '--prefer-dist'], demo)

const envFile = resolve(demo, '.env')
if (!existsSync(envFile)) copyFileSync(resolve(demo, '.env.example'), envFile)

const databaseDirectory = resolve(demo, 'database')
mkdirSync(databaseDirectory, { recursive: true })
const databaseFile = resolve(databaseDirectory, 'database.sqlite')
if (!existsSync(databaseFile)) closeSync(openSync(databaseFile, 'wx'))

const env = readFileSync(envFile, 'utf8')
const applicationKey = env.match(/^APP_KEY=(.*)$/m)?.[1]?.trim()
if (!applicationKey) run('php', ['artisan', 'key:generate', '--force'], demo)

run('php', ['artisan', 'migrate', '--force'], demo)
