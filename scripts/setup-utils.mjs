import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function repositoryRoot(moduleUrl) {
  return resolve(dirname(fileURLToPath(moduleUrl)), '..')
}

export function hasApplicationKey(envContents) {
  const keyLine = envContents
    .split(/\r?\n/)
    .find((line) => /^\s*(?:export\s+)?APP_KEY\s*=/.test(line))

  if (!keyLine) return false

  const value = keyLine.replace(/^\s*(?:export\s+)?APP_KEY\s*=\s*/, '').trim()
  const unquotedValue = value.replace(/^(?:"([^"]*)"|'([^']*)')$/, '$1$2').trim()

  return unquotedValue.length > 0
}
