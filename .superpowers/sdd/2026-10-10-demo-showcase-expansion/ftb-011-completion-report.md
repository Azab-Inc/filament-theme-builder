# FTB-011 completion slice report

## Status

The non-registry portion of FTB-011 is complete in this worktree. FTB-011
remains in progress because FTB-006's semantic registry and inheritance work is
explicitly unresolved.

## Changed files

- `demo/app/Filament/Pages/Showcase/FormsShowcase.php`
  - Reorganized the existing non-persisting page around named native fixtures.
  - Preserved the `/demo/admin/forms-showcase` route, panel navigation, brand,
    and seeded authentication behavior.
- `demo/app/Filament/Pages/Showcase/Forms/ProductEditorForm.php`
  - Added product text, price, select, toggle, date, safe local image
    representation, disabled reference, wizard, and tabbed layouts.
- `demo/app/Filament/Pages/Showcase/Forms/CustomerContactForm.php`
  - Added deterministic address and contact fields.
- `demo/app/Filament/Pages/Showcase/Forms/OrderStatusForm.php`
  - Added status options, status notes, and required server-side validation.
- `demo/tests/Feature/Filament/Showcase/FormsShowcaseTest.php`
  - Replaced campaign assertions with named fixture, deterministic state, and
    validation coverage.
- `e2e/demo-showcase.spec.ts`
  - Replaced campaign-centric forms coverage with named fixture, layout,
    light/dark, upload-acceptance, interaction, validation, and focus checks.
- `COVERAGE.md`
  - Recorded only the implemented named form/schema surfaces and retained the
    registry/inheritance gap.

## Verification

All focused checks passed:

- `php artisan test tests/Feature/Filament/Showcase/FormsShowcaseTest.php`
  - 6 tests, 6 passed, 63 assertions.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'forms and schemas showcase'`
  - 4 tests passed.
- `vendor/bin/pint --test`
  - Passed.
- `vendor/bin/phpstan analyse app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/FormsShowcaseTest.php`
  - Passed with 0 errors.
- `git diff --check`
  - Passed.

The required red-first checks were also observed before implementation:

- New focused PHP assertions failed because the named fixtures and fields were
  absent, then passed after implementation.
- The new forms Playwright test failed because `ProductEditorForm` was absent,
  then passed after implementation.
- The disabled-state assertion was added and observed failing before the
  disabled product reference was implemented, then passed.

## Full-suite concern

`php artisan test` does not complete because the unrelated existing
`PanelBrandingNavigationTest::test_showcase_badges_ignore_ordinary_create_delete_and_visitor_auth_state`
causes a premature PHP process exit. Running that test with
`--process-isolation` exposes the root error:

```text
Fatal error: Cannot redeclare App\Filament\Support\EntityResourceTable::filtersFor()
in app/Filament/Support/EntityResourceTable.php on line 81
```

`EntityResourceTable.php` is outside this slice and was not changed.

## Assumptions and safety

- “Upload representation” is a native dependency-free `Placeholder` labelled
  for product image coverage; it describes JPEG/PNG preview handling without
  exposing a file input or writing to storage.
- Showcase submissions remain validation-only and do not persist records or
  uploaded files.
- Existing campaign-specific controls were replaced as requested by the
  completion brief; the public showcase route and navigation identity remain
  unchanged.
- No FTB-016 forced-state controls were added.

## Unresolved blocker and remaining gaps

- FTB-006 semantic registry, selector mapping, and Global → Component → Variant
  → State inheritance are not implemented here. No parallel registry was
  introduced.
- Full first-party Filament form/schema coverage remains outside this named
  fixture slice; FTB-011 must remain `in-progress` until registry/inheritance
  and any remaining acceptance coverage are completed elsewhere.
- The unrelated `EntityResourceTable::filtersFor()` redeclaration must be fixed
  separately before the entire PHP suite can pass.

## Fix round 1

### Reviewer findings addressed

1. Replaced the real local-storage `FileUpload` with a native Filament
   `Placeholder` containing `Local preview only; JPEG/PNG; not stored`. The
   browser test asserts the representation is visible and that no file input is
   rendered, eliminating filesystem persistence from this showcase path.
2. Restored `product_long_text` as a deterministic, visible text area with a
   max-length rule. PHP covers its seeded value and overflow validation;
   Playwright covers the visible prefilled long-text state.

### Changed files

- `demo/app/Filament/Pages/Showcase/Forms/ProductEditorForm.php`
- `demo/app/Filament/Pages/Showcase/FormsShowcase.php`
- `demo/tests/Feature/Filament/Showcase/FormsShowcaseTest.php`
- `e2e/demo-showcase.spec.ts`
- This report

### Red-first evidence

- PHP failed before implementation because the response still contained the
  file input, the placeholder text was absent, and `product_long_text` was not
  a schema component.
- Playwright failed before implementation because the safe upload text was
  absent; after the first implementation it exposed the missing hydrated
  long-text value, which was corrected by keeping the long-text field in the
  always-visible Section/grid layout.

### Fix-round verification

- `php artisan test tests/Feature/Filament/Showcase/FormsShowcaseTest.php`
  - 7 tests, 7 passed, 72 assertions.
- `npx playwright test e2e/demo-showcase.spec.ts --grep 'forms and schemas showcase'`
  - 4 tests passed.
- `vendor/bin/pint --test`
  - Passed.
- `vendor/bin/phpstan analyse app/Filament/Pages/Showcase tests/Feature/Filament/Showcase/FormsShowcaseTest.php`
  - Passed with 0 errors.
- `git diff --check`
  - Passed.

FTB-006 registry/inheritance and FTB-016 forced-state controls remain out of
scope. The unrelated full-suite `EntityResourceTable::filtersFor()` fatal
remains unchanged.
