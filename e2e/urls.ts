export const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:4175'
const composeE2e = process.env.COMPOSE_E2E === '1'

export const builderBaseUrl = process.env.BUILDER_BASE_URL ?? (composeE2e ? composeBaseUrl : 'http://127.0.0.1:4173')
export const demoBaseUrl = process.env.DEMO_BASE_URL ?? (composeE2e ? composeBaseUrl : 'http://127.0.0.1:4174')

export const previewUrl = `${demoBaseUrl}/demo/admin`
