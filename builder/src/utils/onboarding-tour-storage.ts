import type { OnboardingTourCompletion } from '@/models/onboarding-tour-completion.model'

export const ONBOARDING_TOUR_STORAGE_KEY = 'ftb-onboarding-tour'
const ONBOARDING_TOUR_SCHEMA_VERSION = 1

function isCompletionRecord(value: unknown): value is OnboardingTourCompletion {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return record.schemaVersion === ONBOARDING_TOUR_SCHEMA_VERSION && typeof record.completedAt === 'string' && Number.isFinite(Date.parse(record.completedAt))
}

export function readOnboardingTourCompletion(storage?: Storage): boolean {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(ONBOARDING_TOUR_STORAGE_KEY)
    return raw ? isCompletionRecord(JSON.parse(raw) as unknown) : false
  } catch {
    return false
  }
}

export function writeOnboardingTourCompletion(storage?: Storage): void {
  try {
    const record = { schemaVersion: ONBOARDING_TOUR_SCHEMA_VERSION, completedAt: new Date().toISOString() } satisfies OnboardingTourCompletion
    const targetStorage = storage ?? globalThis.localStorage
    targetStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Storage is optional; a blocked or full store must not affect theme state.
  }
}
