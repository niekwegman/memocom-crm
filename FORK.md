# Memocom CRM — fork changes

This repository is Memocom's fork of [twentyhq/twenty](https://github.com/twentyhq/twenty),
used as the base for all client CRM deployments and Memocom's own internal
instance. This file documents every deliberate deviation from upstream so
upgrades stay auditable. Keep it updated: one section per change, newest first.

## Fork maintenance model

- The fork carries a **small patch set on top of upstream `main`**. On upgrade,
  rebase the patch commits onto the new upstream release, verify, then
  force-push (`--force-with-lease`) to `origin main`. All local clones
  (per-client checkouts under `~/Werk/Klanten/<Client>/Tech/memocom-crm`) then
  reset to the new main.
- Workspace apps (e.g. `memocom-app`, `optifin-finance-workspace`) live in
  separate repositories and are *not* part of this fork.

## Patch set

### fix(server): don't crash uploads when PDF metadata detection throws

- Commit: `51522dad` (2026-07-06)
- File: `packages/twenty-server/src/engine/core-modules/file/utils/extract-file-info-or-throw.utils.ts`
- Problem: `@file-type/pdf`'s custom detector parses embedded XFA/XMP XML with
  a strict sax parser that throws `Non-whitespace before first tag` on PDFs
  with malformed metadata — common for scanned/signed documents. The error was
  unhandled, so **every upload of such a file failed with a 500** (both
  attachments and FILES fields).
- Fix: wrap `fileTypeParser.fromBuffer` in try/catch; on failure, fall back to
  magic-byte detection (`%PDF` prefix → `application/pdf`), otherwise defer to
  the existing extension-based fallback.
- Reproduction: upload a scanned signed offerte PDF (e.g. print → sign → scan
  workflow output).
- Upstream status: **bug exists in stock Twenty ≤ 2.18.5; candidate PR to
  twentyhq/twenty.** Drop this patch once upstream ships an equivalent fix.

### rebrand: rename Twenty to Memocom CRM

- Commit: `51f85c84` (originally authored 2026-06-16, re-rebased on upgrades)
- Scope: ~127 files, exclusively **user-facing branding**:
  - Page title, `og:title`, `twitter:title` in `index.html`
  - PWA manifest name/short_name
  - Default workspace name constant and default workspace logo
  - Auth footer, login welcome text, timeline system author name
  - All transactional email templates (invite, verify, password, suspended)
  - App icons regenerated from `logo.svg` (Android, iOS, Windows 11)
- **Technical identifiers are intentionally unchanged** (package names, class
  names, config markers, license headers) to keep upstream rebases trivial and
  stay license-compliant.

## Upgrade checklist

1. `git fetch upstream` (add once: `git remote add upstream https://github.com/twentyhq/twenty.git`)
2. Rebase the patch set onto the target upstream tag/commit; resolve conflicts
   (the rebrand touches only strings/assets; the upload fix touches one util).
3. Check whether upstream fixed anything in this patch set — drop superseded
   patches and update this file.
4. Build + run locally, sync a workspace app against it, upload a scanned PDF.
5. `git push --force-with-lease origin main`, then update client checkouts.
