# FTB-051 approved prototype decision

The user approved A (field-level popover) from the temporary `/?color-prototype=1&variant=A|B|C` exploration. A provides Custom and Tailwind tabs, searchable family/shade ramps, target identification, explicit replacement of current references, and field-specific editing. B inline expansion and C side panel were not selected.

The `ColorChoicePrototype*`, `use-color-choice-prototype*`, `color-choice-prototype*` artifacts are captured in the immediately associated prototype-source commit as throwaway primary design references. They are not the production implementation and must not be reintroduced as a domain/state/persistence boundary.

Promotion replaces the temporary color-prototype route with the production shared ColorField/ColorPopover integrated through existing adapters. Production uses the real iframe and existing validators/history/storage; the prototype's static preview and scratch theme are not promoted. The separate Studio visual prototype is preserved.

Production snapshot normalization is deterministic and bundled; prototype canvas conversion is not promoted. Existing live `var(...)` references remain untouched until explicit field edits. Selecting a named Tailwind shade writes its literal value without a schema or capability expansion.
