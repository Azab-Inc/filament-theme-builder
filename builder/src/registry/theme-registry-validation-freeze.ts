import type { RegistryEntry } from '@/models/theme-registry.model'

export function freezeEntry(entry: RegistryEntry): RegistryEntry {
  const controls = entry.controls.map((control) =>
    Object.freeze({
      ...control,
      constraints: control.constraints
        ? Object.freeze({
            ...control.constraints,
            pattern: control.constraints.pattern
              ? Object.freeze({
                  source: control.constraints.pattern.source,
                  flags: control.constraints.pattern.flags,
                })
              : undefined,
          })
        : undefined,
    }),
  )
  return Object.freeze({
    ...entry,
    selectors: Object.freeze([...entry.selectors]),
    controls: Object.freeze(controls),
    variants: Object.freeze([...entry.variants]),
    states: Object.freeze([...entry.states]),
  })
}
