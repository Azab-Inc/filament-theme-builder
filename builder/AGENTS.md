# Vue Builder Guidelines

These instructions apply to the Vue application in `builder/`.

## Core Rules

- Use TypeScript for all application code. Vue components must use `<script setup lang="ts">`.
- Prefer `type` declarations. Use `interface` only when declaration merging or another concrete TypeScript requirement makes it necessary.
- Do not install or add a third-party package without first asking for and receiving explicit user consent.
- Prefer the existing dependencies, project utilities, and platform APIs before proposing a new package.
- Use the `@/*` alias for imports from `src/`.

## Source Structure

- Put domain and application data types in `src/models/`.
- Name model files with the `.model.ts` suffix, such as `src/models/color.model.ts`.
- Put transfer-only shapes in `src/dtos/` and name them with the `.dto.ts` suffix. A DTO is appropriate when only part of a model must be sent to another boundary.
- Put reusable reactive behavior, lifecycle ownership, and application-effect orchestration in `src/composables/`.
- Put deterministic validation, resolution, transformation, serialization, and generation functions in `src/utils/`. These modules remain independent of Vue and browser side effects.
- Put cohesive visual sections and reusable controls in `src/components/` as `.vue` components.
- Put route-level views in `src/pages/`.
- Put Pinia state in `src/stores/`.

Keep responsibilities in their designated layer. Do not duplicate a domain model as a DTO unless the transfer shape genuinely differs from the model. The approved refactor migrates existing `src/services/` modules to these boundaries; new code belongs in the target folders.

## Vue Components

- Give each cohesive visual section or reusable control its own `.vue` component in `src/components/`; group related native HTML elements within that component.
- Keep `App.vue` as a composition shell that selects views and connects top-level components. Feature markup, editor controls, and application workflows belong in components and composables.
- At approximately 100 lines, review a `.vue` file for separate responsibilities and extract meaningful components or composables. Use responsibility boundaries rather than splitting solely to meet a line count.
- Components express UI through typed props, emits, slots, and focused composables. Keep business transformations and shared canonical state in their designated layers.

Every Vue single-file component must keep its sections in this order:

1. `<script setup lang="ts">`
2. `<template>`
3. `<style>`

Use `<style>` only when component-scoped CSS is necessary. Use Tailwind for styling throughout the application and avoid introducing separate CSS systems or ad hoc styling conventions.

## Functionality

- Name composable files and exports `useX`, and give each one a focused responsibility. Composables coordinate Vue reactivity, lifecycle, and browser/network/storage effects through explicit, testable inputs.
- Reusable pure functions belong in `src/utils/`, even when composables and stores consume them. Preserve their plain-function APIs rather than adding artificial refs, watchers, or component-instance requirements.
- Keep shared canonical application state in Pinia stores; composables expose or coordinate that state rather than create competing copies.
- Register reactive effects and event listeners in the appropriate lifecycle/scope and clean them up when their owner is disposed. Independent component mounts must not duplicate listeners or share unintended mutable state.
- Before extracting repeated code into an abstraction, describe the duplication and proposed boundary. Reuse focused controls and composables across editor sections instead of copying markup or mutation logic.

## Filament Theme Builder Context

The application builds themes for Filament PHP. Name models, DTOs, components, pages, and composables after the domain concept they represent. Keep PHP/API transfer concerns at the DTO or integration boundary rather than leaking them into reusable UI components.

## Validation

After relevant Vue changes, run all three commands from `builder/`:

```sh
npm run type-check
npm run test:unit
npm run build
```

Do not report the work as complete until these checks pass, or clearly report any existing or unresolved failure.
