export type TailwindColor = Readonly<{
  family: string
  shade: number
  name: string
  value: string
  sourceValue: string
}>

export type TailwindPaletteMetadata = Readonly<{
  sourceUrl: string
  version: string
  snapshotDate: string
  license: 'MIT'
  licenseNotice: string
  transformation: string
}>
