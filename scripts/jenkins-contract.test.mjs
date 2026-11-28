import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const jenkinsfile = readFileSync(new URL('../Jenkinsfile', import.meta.url), 'utf8')

test('Jenkins installs locked dependencies before source checks', () => {
  const installStage = jenkinsfile.indexOf("stage('Install locked dependencies')")
  const standardsStage = jenkinsfile.indexOf("stage('Changed-code standards guard')")
  assert.ok(installStage >= 0 && installStage < standardsStage)
  assert.match(jenkinsfile.slice(installStage, standardsStage), /npm ci/)
  assert.match(jenkinsfile.slice(installStage, standardsStage), /composer --working-dir=demo install --no-interaction --prefer-dist --no-progress/)
})

test('Jenkins declares bounded, isolated, and archived browser execution', () => {
  assert.match(jenkinsfile, /disableConcurrentBuilds\(\)/)
  assert.match(jenkinsfile, /options \{\s*timeout\(time: 30, unit: 'MINUTES'\)/s)
  assert.match(jenkinsfile, /archiveArtifacts artifacts: 'artifacts\/\*\*,playwright-report\/\*\*,test-results\/\*\*'/)
  assert.match(jenkinsfile, /COMPOSE_PROJECT_NAME/)
  assert.match(jenkinsfile, /timeout\s+12m/)
  assert.match(jenkinsfile, /\.\.\/scripts\/verification-checkpoint\.mjs profile unit-timeout/)
  assert.doesNotMatch(jenkinsfile, /--testTimeout=20000|--hookTimeout=20000/)
  assert.match(jenkinsfile, /timeout 15m sh -c .*verification-checkpoint\.mjs browser/s)
  assert.doesNotMatch(jenkinsfile, /playwright test e2e\/demo-showcase\.spec\.ts e2e\/theme-foundations\.spec\.ts/)
})
