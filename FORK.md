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

### fix(front): PageLayout widgets clip/stretch content instead of scrolling and packing at the top

- File: `packages/twenty-front/src/modules/page-layout/widgets/widget-card/components/WidgetCardContent.tsx`
- Problem: `StyledWidgetCardContent` is a `display: grid` container with only
  `grid-template-columns` set (rows are implicit `auto`) and `height: 100%`,
  `overflow: hidden`, no `align-content`. Two related symptoms:
  1. A workspace app's custom `RECORD_PAGE` `FIELD`/`FIELDS` widget with no
     explicit `gridPosition` gets a small default (`rowSpan: 4, columnSpan: 4`
     — 244px at the platform's 55px row height) — too short for a relation
     card's fields once expanded, so the bottom of the card gets clipped with
     no scrollbar (`overflow: hidden`, not `auto`).
  2. Once a workspace app sets a taller `gridPosition.rowSpan` to fix (1), the
     grid's default `align-content: normal` (which resolves to `stretch` for
     `auto`-sized tracks with leftover space) spreads the few short list items
     apart to fill the extra height, instead of packing them at the top —
     looks like broken list spacing with large gaps between a couple of
     collapsed relation cards.
- Fix: `align-content: start` (packs auto rows at the top, no more stretch)
  + `overflow-y: auto` instead of `overflow: hidden` (a safety net so content
    taller than a given `rowSpan` scrolls instead of clipping, rather than
    relying solely on every workspace app guessing a large-enough `rowSpan`).
- Found live (OptiFin prod, July 2026) on `optifin-finance-workspace`'s
  Financing Application / Prospect Detail page layouts — see
  [[twenty-app-dev]]'s Views & page layouts section for the companion
  workspace-app-side fix (setting explicit `gridPosition` per widget).
- Reproduction: any `RECORD_PAGE` layout with a `FIELD`(`fieldDisplayMode:
  CARD`)/`FIELDS` widget and no explicit `gridPosition` on a relation with
  more than ~4-5 fields when expanded.
- **Upgrade note (2026-08-09 rebase onto upstream `main` @ `c520eb39dd`):**
  upstream independently added `align-content: start` unconditionally in the
  same file — that half of this patch is now upstream default, not a fork
  deviation. Upstream also added its own `hasBoundedHeight`-conditional
  `max-height`/`overflow` mechanism (new `STACKED_WIDGET_MAX_HEIGHT` feature)
  which sets `overflow: hidden` whenever `hasBoundedHeight` is false — i.e.
  exactly our original bug's case, since a workspace app's default `FIELD`/
  `FIELDS` widget doesn't opt into that prop. Resolution: kept upstream's
  `max-height`/`hasBoundedHeight` behavior as-is, but still force
  `overflow-y: auto` (never `hidden`) regardless of `hasBoundedHeight`, plus
  `overflow-x: hidden`.
- **Upgrade note (2026-08-27 rebase onto `twenty/v2.36.0`):** the file was
  rewritten again, more substantially this time — `align-content`,
  `hasBoundedHeight`, and `STACKED_WIDGET_MAX_HEIGHT` are all gone.
  `background-color`/`border`/`isInVerticalListTab`/`isMobile` (props that
  didn't even exist when this patch was first written) are also gone from
  this component now, having apparently moved elsewhere in the same
  refactor. The grid is now a single implicit row (no `grid-template-rows`),
  so the old stretch/`align-content` half of this bug no longer applies —
  nothing to re-patch there. `overflow` is now a single ternary driven by a
  CSS custom property: `isFixedHeight ? 'clip' : 'var(--widget-card-content-overflow,
  hidden)'` — other call sites (e.g. `PageLayoutVerticalList.tsx`) opt out of
  the default by setting `--widget-card-content-overflow: visible` on an
  ancestor. Re-derived fix: changed the fallback from `hidden` to `auto`
  (`var(--widget-card-content-overflow, auto)`) — same intent as before
  (content that overflows its cell scrolls instead of clipping when nothing
  more specific opts in), expressed through the new mechanism instead of a
  hardcoded `overflow-y`/`overflow-x` split. `isFixedHeight`'s `'clip'` and
  any explicit `--widget-card-content-overflow` override (e.g. `visible`)
  are both left untouched. **Not yet visually re-verified in a running app**
  (this rebase only got as far as `build`/`typecheck` passing) — re-check
  against the original repro (a `FIELD`/`FIELDS` widget with an expanded
  relation card, no explicit `gridPosition`) before trusting this in
  production, since the surrounding component was rewritten enough that a
  build-clean patch isn't the same as a behavior-verified one.

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
