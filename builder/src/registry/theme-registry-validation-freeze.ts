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
    paddingTargets: entry.paddingTargets
      ? Object.freeze(entry.paddingTargets.map((target) => Object.freeze({
          ...target,
          selectors: Object.freeze([...target.selectors]),
          units: Object.freeze([...target.units]),
          variants: Object.freeze([...target.variants]),
          states: Object.freeze([...target.states]),
          evidence: Object.freeze(target.evidence.map((evidence) => Object.freeze({
            ...evidence,
            values: evidence.values ? Object.freeze({ ...evidence.values }) : undefined,
          }))),
        })))
      : undefined,
  })
}
