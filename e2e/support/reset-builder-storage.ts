export function resetBuilderStorage(): void {
  localStorage.clear()
  localStorage.setItem('ftb-onboarding-tour', JSON.stringify({ schemaVersion: 1, completedAt: '2026-11-19T00:00:00.000Z' }))
}
