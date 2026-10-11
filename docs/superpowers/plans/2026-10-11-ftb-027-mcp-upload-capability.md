# FTB-027 Safe Upload MCP Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose a truthful, preview-only MCP capability for the bounded demo upload contract without adding an unsafe binary mutation path.

**Architecture:** Add a dry-run preview operation to `TemporaryUploadStorage` so validation and quota decisions remain in the domain boundary. Register a Laravel MCP tool through Boost configuration; it derives owner identity from the authenticated MCP request, never accepts owner/path/content bytes, and returns an explicit unsupported-commit result.

**Tech Stack:** Laravel 13, Laravel Boost 2.10.3, Laravel MCP 1.0.1, PHPUnit, Pint, PHPStan, Docker Compose, Playwright.

**Spec:** Approved user contract in the conversation; `/home/swagoverlord/.config/opencode/rules/ai-operability.md`.

## Global Constraints

- Do not add dependencies.
- Do not accept base64, filesystem paths, arbitrary owners, or executable/SVG content.
- Preview must not mutate files or purge quota storage.
- Commit must remain explicitly refused because the installed MCP contract has no safe binary upload transport.
- Do not modify `.playwright-mcp/` or unrelated worktree changes.
- Update capability/status documentation only from test and runtime evidence.

---

### Task 1: Establish failing storage preview and MCP contract tests

**Files:**
- Create: `demo/tests/Feature/Uploads/TemporaryUploadMcpTest.php`
- Modify: `demo/tests/Feature/Uploads/TemporaryUploadStorageTest.php`

**Interfaces:**
- Tests will define the desired `TemporaryUploadStorage::preview(...)` result and the MCP tool class/registration contract.

- [ ] Write tests for allowed/rejected metadata, file-size and owner/global quota decisions, no preview mutation, owner override rejection, confirmation/stale token behavior, and unsupported commit response.
- [ ] Run focused tests and verify they fail because the preview API and MCP tool are absent.

### Task 2: Add non-mutating storage preview boundary

**Files:**
- Modify: `demo/app/Support/Uploads/TemporaryUploadStorage.php`

- [ ] Implement metadata validation and dry-run quota evaluation shared with `store()`.
- [ ] Ensure preview never creates directories, deletes files, or writes files.
- [ ] Run focused storage tests and verify they pass.

### Task 3: Register the preview-only Boost MCP tool

**Files:**
- Create: `demo/app/Mcp/Tools/PreviewTemporaryUpload.php`
- Create: `demo/config/boost.php`
- Create/modify: `demo/tests/Feature/Mcp/TemporaryUploadMcpToolTest.php` as needed

- [ ] Register the tool through Boost's `mcp.tools.include` configuration.
- [ ] Derive owner from `Laravel\Mcp\Request::user()`; reject unauthenticated or supplied owner overrides.
- [ ] Accept only filename, MIME type, size, and explicit confirmation fields; reject content/path inputs.
- [ ] Return preview data without mutation and return `unsupported_upload_input` for every commit attempt.
- [ ] Run in-process Laravel MCP tests and verify registration, schemas, responses, and no writes.

### Task 4: Update evidence documentation and report

**Files:**
- Modify: `docs/ai-operability/demo-showcase-capability-inventory.md`
- Create: `.superpowers/sdd/2026-10-10-demo-showcase-expansion/ftb-027-mcp-report.md`

- [ ] Record preview-only status, explicit commit limitation, owner/authorization rule, and no binary transport claim.
- [ ] Record exact package versions and commands/evidence.
- [ ] Keep FTB-027 status `done`; do not claim full MCP mutation coverage.

### Task 5: Verify and commit

- [ ] Run focused PHP tests, MCP verification, Pint, PHPStan, Compose health, and relevant Playwright checks.
- [ ] Inspect diff/status and preserve the pre-existing `.gitignore` change.
- [ ] Commit only scoped changes with `Feature: expose safe upload MCP capability`.
