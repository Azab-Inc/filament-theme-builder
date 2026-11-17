export type RawPropertyOption = {
  value: string
  label: string
}

export type RawPropertyControl =
  | { kind: 'color' }
  | { kind: 'length'; units: readonly string[]; step?: number; max?: number }
  | { kind: 'number'; min: number; max: number; step: number }
  | { kind: 'spacing'; units: readonly string[]; step?: number }
  | { kind: 'select'; options: readonly RawPropertyOption[] }
  | { kind: 'font-family' }
  | { kind: 'shadow'; options: readonly RawPropertyOption[] }

export type ParsedLength = {
  amount: string
  unit: string
}

export type ParsedSpacing = {
  amounts: [string, string, string, string]
  unit: string
}
