import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, statSync } from 'node:fs'
import test from 'node:test'

const compose = ['compose', '-f', 'compose.dev.yaml', 'exec', '-T']
const hostUid = Number(process.env.HOST_UID ?? execFileSync('id', ['-u'], { encoding: 'utf8' }).trim())
const hostGid = Number(process.env.HOST_GID ?? execFileSync('id', ['-g'], { encoding: 'utf8' }).trim())

function serviceRuntime(service) {
  const processList = execFileSync('docker', [...compose, service, 'sh', '-lc', 'ps -o pid,user,args'], { encoding: 'utf8' })
  const processLine = processList.split('\n').find((line) => line.includes('node_modules/.bin/'))
  assert.ok(processLine, `No Node process found in ${service}`)
  const processFields = processLine.trim().split(/\s+/)
  const pid = processFields[0]
  const user = processFields[1]
  const status = execFileSync('docker', [...compose, service, 'sh', '-lc', `cat /proc/${pid}/status`], { encoding: 'utf8' })
  const uid = Number(/^Uid:\s+(\d+)/m.exec(status)?.[1])
  const gid = Number(/^Gid:\s+(\d+)/m.exec(status)?.[1])
  return { uid, gid, user }
}

function assertHostOwned(path) {
  const stat = statSync(path)
  assert.equal(stat.uid, hostUid)
  assert.equal(stat.gid, hostGid)
}

test('running Node services and their generated artifacts match the host UID/GID', () => {
  const artifacts = [
    ['builder-vite', '.ftb-runtime-builder-ownership-test'],
    ['demo-vite', '.ftb-runtime-demo-ownership-test'],
  ]
  try {
    for (const [service, relativePath] of artifacts) {
      const runtime = serviceRuntime(service)
      assert.deepEqual({ uid: runtime.uid, gid: runtime.gid }, { uid: hostUid, gid: hostGid })
      const containerPath = service === 'builder-vite' ? `/app/${relativePath}` : `/var/www/html/${relativePath}`
      execFileSync('docker', [...compose, service, 'su', '-s', '/bin/sh', '-p', runtime.user, '-c', `printf runtime > ${containerPath}`], { stdio: 'inherit' })
      const localPath = service === 'builder-vite' ? `builder/${relativePath}` : `demo/${relativePath}`
      assert.equal(existsSync(localPath), true)
      assertHostOwned(localPath)
    }
    const alternateGid = 65532
    const cacheStat = execFileSync('docker', ['compose', '-f', 'compose.dev.yaml', 'run', '--rm', '--no-deps', '--entrypoint', '/scripts/compose-node-entrypoint.sh', '-e', `HOST_UID=${hostUid}`, '-e', `HOST_GID=${alternateGid}`, 'builder-vite', 'sh', '-c', 'printf cache > /tmp/npm-cache/.ftb-cache-ownership-test && stat -c %u:%g /tmp/npm-cache/.ftb-cache-ownership-test'], { encoding: 'utf8' }).trim()
    assert.equal(cacheStat, `${hostUid}:${alternateGid}`)
    const builder = serviceRuntime('builder-vite')
    execFileSync('docker', [...compose, 'builder-vite', 'su', '-s', '/bin/sh', '-p', builder.user, '-c', 'npm run build-only -- --outDir /app/.ftb-runtime-builder-dist'], { stdio: 'inherit' })
    assertHostOwned('builder/.ftb-runtime-builder-dist/index.html')
    const demo = serviceRuntime('demo-vite')
    execFileSync('docker', [...compose, 'demo-vite', 'su', '-s', '/bin/sh', '-p', demo.user, '-c', 'npm run build -- --outDir /var/www/html/.ftb-runtime-demo-dist'], { stdio: 'inherit' })
    assertHostOwned('demo/.ftb-runtime-demo-dist/manifest.json')
  } finally {
    rmSync('builder/.ftb-runtime-builder-ownership-test', { force: true })
    rmSync('demo/.ftb-runtime-demo-ownership-test', { force: true })
    rmSync('builder/.ftb-runtime-builder-dist', { recursive: true, force: true })
    rmSync('demo/.ftb-runtime-demo-dist', { recursive: true, force: true })
  }
})

test('the Node entrypoint preserves argv boundaries and forwards termination signals', () => {
  const removeOneOffContainers = () => {
    const containers = execFileSync('docker', ['ps', '-aq', '--filter', 'label=com.docker.compose.project=filament-theme-builder', '--filter', 'label=com.docker.compose.oneoff=True'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
    if (containers.length > 0) execFileSync('docker', ['rm', '-f', ...containers], { stdio: 'ignore' })
  }
  removeOneOffContainers()
  const entrypoint = '/scripts/compose-node-entrypoint.sh'
  const command = ['node', '-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', 'arg with spaces', 'quote"and\'apostrophe']
  const argv = execFileSync('docker', ['compose', '-f', 'compose.dev.yaml', 'run', '--no-deps', '--entrypoint', entrypoint, '-e', `HOST_UID=${hostUid}`, '-e', `HOST_GID=${hostGid}`, 'builder-vite', ...command], { encoding: 'utf8' }).trim()
  assert.deepEqual(JSON.parse(argv), ['arg with spaces', 'quote"and\'apostrophe'])

  const signalScript = 'process.on("SIGTERM", () => process.exit(0)); process.on("SIGINT", () => process.exit(0)); setInterval(() => {}, 1000)'
  for (const signal of ['TERM', 'INT']) {
    const container = execFileSync('docker', ['compose', '-f', 'compose.dev.yaml', 'run', '-d', '--no-deps', '--entrypoint', entrypoint, '-e', `HOST_UID=${hostUid}`, '-e', `HOST_GID=${hostGid}`, 'builder-vite', 'node', '-e', signalScript], { encoding: 'utf8' }).trim()
    try {
      let ready = false
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const processes = execFileSync('docker', ['exec', container, 'ps', '-o', 'args'], { encoding: 'utf8' })
        ready = processes.includes('node -e') && !processes.includes('/scripts/compose-node-entrypoint.sh')
        if (ready) break
        execFileSync('sleep', ['0.1'])
      }
      assert.equal(ready, true, 'the signal test child did not start within 10 seconds')
      execFileSync('docker', ['kill', '--signal', signal, container], { stdio: 'ignore' })
      let running = true
      for (let attempt = 0; attempt < 50; attempt += 1) {
        running = execFileSync('docker', ['inspect', '-f', '{{.State.Running}}', container], { encoding: 'utf8' }).trim() === 'true'
        if (!running) break
        execFileSync('sleep', ['0.1'])
      }
      assert.equal(running, false, `${signal} was not forwarded within 5 seconds`)
      assert.equal(execFileSync('docker', ['inspect', '-f', '{{.State.ExitCode}}', container], { encoding: 'utf8' }).trim(), '0')
    } finally {
      execFileSync('docker', ['rm', '-f', container], { stdio: 'ignore' })
    }
  }
  removeOneOffContainers()
  const orphans = execFileSync('docker', ['ps', '-a', '--filter', 'label=com.docker.compose.project=filament-theme-builder', '--filter', 'label=com.docker.compose.oneoff=True', '--format', '{{.Names}}'], { encoding: 'utf8' }).trim()
  assert.equal(orphans, '')
})
