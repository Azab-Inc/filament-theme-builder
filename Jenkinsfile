pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
    }

    stages {
        stage('Install locked dependencies') {
            steps {
                sh 'npm ci'
                sh 'npm --prefix builder ci'
                sh 'npm --prefix demo ci'
                sh 'composer --working-dir=demo install --no-interaction --prefer-dist --no-progress'
            }
        }

        stage('Changed-code standards guard') {
            steps {
                sh 'git diff --check'
                sh 'FTB_BASE_REF="origin/${CHANGE_TARGET:-dev}" node builder/scripts/changed-code-standards.mjs'
                sh 'FTB_BASE_REF="origin/${CHANGE_TARGET:-dev}" node --test builder/scripts/changed-code-standards.test.mjs'
                sh 'node --test builder/scripts/prepare-build-output.test.mjs'
            }
        }

        stage('Root contract checks') {
            steps {
                sh 'node --test scripts/setup.test.mjs scripts/compose-bootstrap.test.mjs scripts/demo-first-roadmap.test.mjs scripts/jenkins-contract.test.mjs'
            }
        }

        stage('Builder verification') {
            steps {
                dir('builder') {
                    sh 'npm run test:unit -- --run'
                    sh 'npm run type-check'
                    sh 'npm run build'
                }
            }
        }

        stage('Demo verification') {
            steps {
                dir('demo') {
                    sh 'npm run build'
                }
            }
        }

        stage('Demo PHP verification') {
            steps {
                dir('demo') {
                    sh 'composer test'
                }
            }
        }

        stage('Compose browser verification') {
            options {
                timeout(time: 15, unit: 'MINUTES')
            }
            steps {
                sh '''
                    set -eu
                    mkdir -p artifacts
                    project="ftb-jenkins-${BUILD_TAG:-manual}-${BUILD_NUMBER:-0}"
                    project=$(printf '%s' "$project" | tr '[:upper:]' '[:lower:]' | tr -c '[:alnum:]_' '-')
                    port=$(node -e "const net=require('node:net'); const s=net.createServer(); s.listen(0, '127.0.0.1', () => { console.log(s.address().port); s.close(); });")
                    export COMPOSE_PROJECT_NAME="$project" GATEWAY_PORT="$port"
                    compose="docker compose -p $COMPOSE_PROJECT_NAME -f compose.dev.yaml"
                    cleanup() {
                        set +e
                        $compose ps -a > "artifacts/${COMPOSE_PROJECT_NAME}-ps.txt" 2>&1
                        $compose logs --no-color > "artifacts/${COMPOSE_PROJECT_NAME}-compose.log" 2>&1
                        $compose down --volumes --remove-orphans
                    }
                    trap cleanup EXIT
                    $compose config --quiet
                    $compose up -d --build
                    timeout 12m sh -c 'until curl --fail --silent "http://127.0.0.1:${GATEWAY_PORT}/api/health" >/dev/null; do sleep 2; done'
                    timeout 2m sh -c 'until curl --fail --silent "http://127.0.0.1:${GATEWAY_PORT}/" >/dev/null; do sleep 2; done'
                    COMPOSE_E2E=1 COMPOSE_BASE_URL="http://127.0.0.1:${GATEWAY_PORT}" npx playwright test e2e/ftb-007-bridge.spec.ts e2e/ftb-182-unique-element-id.spec.ts --reporter=line
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'artifacts/**,playwright-report/**,test-results/**', allowEmptyArchive: true
        }
    }
}
