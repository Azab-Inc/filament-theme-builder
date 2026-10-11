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

- “Upload representation” means a native `FileUpload` control configured for
  private local storage, restricted to JPEG/PNG, with no upload package and no
  arbitrary SVG handling.
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
