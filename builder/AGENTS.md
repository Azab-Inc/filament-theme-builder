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
- Put reusable Vue composition logic in `src/composables/`.
- Put reusable Vue components in `src/components/`.
- Put route-level views in `src/pages/`.
- Put Pinia state in `src/stores/`.

Keep responsibilities in their designated layer. Do not duplicate a domain model as a DTO unless the transfer shape genuinely differs from the model.

## Vue Components

Every Vue single-file component must keep its sections in this order:

1. `<script setup lang="ts">`
2. `<template>`
3. `<style>`

Use `<style>` only when component-scoped CSS is necessary. Use Tailwind for styling throughout the application and avoid introducing separate CSS systems or ad hoc styling conventions.

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
