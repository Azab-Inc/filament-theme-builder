import { createHash } from 'node:crypto'
import type { Page, Request } from '@playwright/test'

export type BrowserRelayRouteEvidence = { receipts: number; previews: number; authorizations: number; results: Record<string, unknown>[]; invalidBodies: number }
export async function installBrowserRelayRoutes(page: Page): Promise<BrowserRelayRouteEvidence> {
  const rawJson = '{"schemaVersion":1,"colors":{"primary":"#123456"}}'
  const digest = createHash('sha256').update(rawJson, 'utf8').digest('hex')
  const operationId = 'a'.repeat(64); const claimId = 'b'.repeat(64); let polls = 0
  const evidence: BrowserRelayRouteEvidence = { receipts: 0, previews: 0, authorizations: 0, results: [], invalidBodies: 0 }
  const checkBody = (request: Request, keys: string[]) => {
    const body = request.postDataJSON() as Record<string, unknown>; const actual = Object.keys(body).sort()
    if (actual.join() !== [...keys].sort().join()) evidence.invalidBodies += 1
  }
  await page.route('**/local-theme/relay/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname
    if (path.endsWith('/bootstrap')) return route.fulfill({ json: { version: 1, origin: url.origin, host: url.host, csrfToken: 'playwright-csrf', enabled: true } })
    if (path.endsWith('/pairings') && request.method() === 'POST') {
      checkBody(request, ['version', 'pairingId'])
      const { pairingId } = request.postDataJSON() as { pairingId: string }
      return route.fulfill({ json: { version: 1, pairingId, status: 'pending', expiresAt: Math.floor(Date.now() / 1_000) + 300 } })
    }
    if (path.includes('/pairings/') && path.endsWith('/approve')) {
      checkBody(request, ['version', 'claimId'])
      return route.fulfill({ json: { version: 1, status: 'approved', sessionId: 'pw-session', sessionExpiresAt: Math.floor(Date.now() / 1_000) + 1_800 } })
    }
    if (path.includes('/pairings/')) return route.fulfill({ json: { version: 1, pairingId: path.split('/').at(-1), status: 'pending', claimId, expiresAt: Math.floor(Date.now() / 1_000) + 300 } })
    if (path.endsWith('/sessions/poll')) { checkBody(request, ['version', 'sessionId']); return route.fulfill({ json: { version: 1, operations: polls++ === 0 ? [{ operationId, kind: 'import', status: 'pending' }] : [] } }) }
    if (path.endsWith('/sessions/heartbeat')) { checkBody(request, ['version', 'sessionId']); return route.fulfill({ json: { version: 1, status: 'alive', leaseExpiresAt: Date.now() + 45_000 } }) }
    if (path.endsWith('/sessions/disconnect')) { checkBody(request, ['version', 'sessionId']); return route.fulfill({ json: { version: 1, status: 'disconnected' } }) }
    if (path.endsWith('/payload')) return route.fulfill({ json: { version: 1, operationId, payload: rawJson, filename: 'relay-v1.json', proposedName: 'Relay v1', digest, byteLength: Buffer.byteLength(rawJson) } })
    if (path.endsWith('/receipt')) { checkBody(request, ['version', 'digest', 'received']); evidence.receipts += 1; return route.fulfill({ json: { version: 1, status: 'received' } }) }
    if (path.endsWith('/preview')) { checkBody(request, ['version', 'preview']); evidence.previews += 1; return route.fulfill({ json: { version: 1, status: 'pending', digest } }) }
    if (path.endsWith('/authorize-apply')) { checkBody(request, ['version', 'digest', 'revision', 'displayName']); evidence.authorizations += 1; return route.fulfill({ json: { version: 1, status: 'pending', grantId: 'c'.repeat(64), grantExpiresAt: Math.floor(Date.now() / 1_000) + 4 } }) }
    if (path.endsWith('/result') && request.method() === 'POST') { const result = request.postDataJSON() as Record<string, unknown>; checkBody(request, result.errorCategory ? ['version', 'errorCategory'] : ['version', 'grantId', 'recordId', 'digest']); evidence.results.push(result); return route.fulfill({ json: { version: 1, status: result.errorCategory ? 'rejected' : 'approved' } }) }
    return route.fulfill({ status: 404, json: { error: 'not_found' } })
  })
  return evidence
}
