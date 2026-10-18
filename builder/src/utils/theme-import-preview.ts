import type { ImportVersion } from '@/models/theme-import.model'

export function importDisplayName(filename: string, proposedName: string): string {
  const explicit = proposedName.trim()
  if (explicit) return explicit
  const filenameName = filename.split(/[\\/]/).pop()?.replace(/\.json$/i, '').trim()
  return filenameName || 'Imported theme'
}

export function importSummary(sourceVersion: ImportVersion, migrationPath: number[], decisions: string[]): string[] {
  return [`Imported schema v${sourceVersion} as v4`, `Migration path: ${migrationPath.join(' → ')}`, ...decisions]
}
