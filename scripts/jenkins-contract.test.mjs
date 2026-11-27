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
  assert.match(jenkinsfile, /options \{\s*timeout\(time: 15, unit: 'MINUTES'\)/s)
  assert.match(jenkinsfile, /archiveArtifacts artifacts: 'artifacts\/\*\*,playwright-report\/\*\*,test-results\/\*\*'/)
  assert.match(jenkinsfile, /COMPOSE_PROJECT_NAME/)
  assert.match(jenkinsfile, /timeout\s+12m/)
})
