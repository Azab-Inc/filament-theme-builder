export type ModeLinkBinding = {
  identity: string
  linked: boolean
  label?: string
  disabled?: boolean
  toggle: () => void
}
