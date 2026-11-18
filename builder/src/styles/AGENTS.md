# Builder stylesheet rules — mandatory

## Scope

These instructions apply to `builder/src/styles/**/*.css` and to edits made in this directory. Follow them when creating, modifying, reviewing, or refactoring styles. Keep the builder's design system separate from the user-generated Filament theme and the embedded demo preview. **Do not change the CSS export format**: exported user themes must still support vanilla CSS (default) and Tailwind `@apply` as separate options.

## Non-negotiable rules

1. **Use Tailwind CSS v4 `@apply` for all styling in selector rules.** Do not add ordinary CSS property declarations for layout, spacing, typography, borders, shadows, colors, positioning, etc. Prefer existing Tailwind utilities and semantic theme utilities. Do not introduce another CSS styling framework, Sass, or Less.
2. **All reusable design values must be tokens, never scattered literals.** No hardcoded colors (`#e6f2ee`, `rgb(...)`, `oklch(...)`, named colors) or arbitrary reusable pixel/rem values in selector rules. Define the value once in the existing central token source, then refer to it through a Tailwind utility. A literal may exist _only in its token definition_, not repeated at points of use.
3. **Use native CSS nesting for descendants and states.** Keep related rules under their component's parent selector instead of repeating the full selector in separate flat rules. Use `&` for states, modifiers, and selectors that refer directly to the parent; normal nested element selectors are permitted for descendants.
4. **Do not invent utilities.** Every class in `@apply` must resolve under the project's installed Tailwind version. If no built-in utility fits, define a documented, reusable Tailwind v4 `@utility` (using token references), or expose a semantic token via `@theme` and apply the generated utility. The few raw property declarations needed inside `@theme`, `@utility`, or CSS-variable definitions are exceptions to rule 1; raw declarations inside ordinary selectors are not.
5. **Preserve behavior and specificity.** Refactor without breaking responsive layouts, light/dark mode, hover, focus-visible, disabled/loading/error states, or the builder-to-preview separation. Avoid `!important`, high-specificity selector chains, and broad selectors leaking into the Filament demo iframe.

## Design tokens

- Inspect existing tokens and utility definitions before introducing new ones. Reuse them; do not create near-duplicates.
- Keep builder tokens consistently named (for example `--builder-surface`, `--builder-text`, `--builder-border`, `--builder-radius`, `--builder-control-height`). Use one central definition and appropriate light/dark overrides.
- Prefer Tailwind's design-system namespaces in `@theme` (`--color-*`, `--spacing-*`, `--radius-*`, etc.) when they produce the needed utility. Use `@theme inline` when a utility must reference a separately defined runtime CSS variable.
- Semantic names are preferred over literal names such as `--greenish-1`, `--gray-37`, or `--8px-value`.
- Never change the user's chosen Filament theme tokens merely to style the builder chrome.

## Required CSS structure

**Bad — flat selectors, raw styling and hardcoded values:**

```css
.raw-spacing-field select {
  grid-column: 3;
  grid-row: 1 / span 2;
  background: #e6f2ee;
}

.raw-spacing-field select:focus {
  outline-color: #3885d8;
}
```

**Good — nested selectors + Tailwind utilities + semantic tokens:**

```css
/* Define tokens in the shared token stylesheet, not in every component. */
@theme {
  --color-builder-surface-highlight: #e6f2ee;
  --color-builder-focus: #3885d8;
}

.raw-spacing-field {
  select {
    @apply col-start-3 row-start-1 row-span-2 bg-builder-surface-highlight;

    &:focus-visible {
      @apply outline-2 outline-builder-focus;
    }
  }
}
```

The hex values above are examples of **one-time token definitions only**. In real changes, reuse existing project tokens rather than redefining them in each file.

More nesting examples:

```css
.editor-card {
  @apply rounded-lg border border-builder-border bg-builder-surface;

  & .editor-card__title {
    @apply text-sm font-semibold text-builder-text;
  }

  &:hover {
    @apply shadow-sm;
  }

  > button {
    @apply inline-flex items-center gap-2;
  }
}
```

Use only utilities such as `border-builder-border` or `bg-builder-surface` **after** verifying the relevant theme tokens exist. Don't copy example names blindly.

## Source organization

- Each stylesheet should own one cohesive component or layout concern. Prefer editing an existing relevant file over creating another overlapping prototype stylesheet.
- Avoid duplicate/conflicting definitions spread across `dashboard-*`, `*-prototype`, and `editor-*` stylesheets. Consolidate when safe and within the task scope.
- Put global tokens and reusable utilities in their established shared locations. Avoid redefining the same theme token independently in multiple files.
- Keep nested blocks reasonably shallow (ideally no more than three levels). Extract a semantic class when nesting becomes difficult to read.
- Keep Tailwind CSS `@import`, `@reference`, `@theme`, `@utility`, and `@layer` directives where needed for correct compilation. For separately processed Vue `<style>` blocks or CSS modules, use Tailwind v4 `@reference` to make theme utilities available without duplicating CSS.

## Required workflow for every CSS change

1. **Inspect** the relevant stylesheet, the global theme/token source, and imported styles before editing.
2. **Check** whether the desired values and utilities already exist; reuse them first.
3. **Implement** selector styling using valid `@apply` utilities, native CSS nesting, and semantic tokens.
4. **Audit the touched rules:** no raw layout/style declarations in ordinary selectors; no repeated hardcoded color/dimension values; no avoidable flat descendant selectors; no unsupported `@apply` utilities.
5. **Compile:** from `builder/`, run `npm run build` (and the project's CSS lint/test commands if configured). Fix Tailwind errors instead of bypassing the pipeline.
6. **Verify visually** at representative desktop/mobile widths and in light/dark modes where affected. Ensure the actual Filament demo preview is unchanged except for intentional user-theme output.
7. **Report** any legitimate utility/token limitation explicitly. Do not quietly violate these rules to make a build pass.

## Completion checklist

- [ ] New selector styling uses `@apply`, not raw CSS declarations.
- [ ] Shared design values live in central tokens; no scattered literal colors/sizes.
- [ ] Child elements, states, and modifiers use native CSS nesting where appropriate.
- [ ] All referenced Tailwind utilities are valid and compile.
- [ ] No new duplicate/prototype styling is introduced without justification.
- [ ] Responsive, accessibility, and light/dark behaviors remain intact.
- [ ] `npm run build` passes, and affected views were checked.
