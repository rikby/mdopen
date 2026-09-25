---
code: MDOP-007
status: Implemented
dateCreated: 2026-09-25T12:36:44.000Z
type: Feature Enhancement
priority: Medium
relatedTickets: MDOP-005
---

# MDOP-007: Excel-style table splitting in print CSS

## Problem

Printed pages waste space: a table that does not fit in the space left after
a heading and text is pushed wholesale to the next page
(`table { break-inside: avoid }` in the print stylesheet). See MDOP-006 for
the analysis.

## Solution

In the `@media print` block of `assets/mdopen.css`:

- Remove `table` from the `pre, blockquote, table { break-inside: avoid }`
  rule (keep `pre, blockquote` as-is).
- Add:

```css
.markdown-body table {
  break-inside: auto;
  page-break-inside: auto;
}

.markdown-body thead {
  display: table-header-group;
}

.markdown-body tfoot {
  display: table-footer-group;
}

.markdown-body tr {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

markdown-it already emits `<thead>`; no renderer or template changes needed.

## Decisions

- Pure CSS only — no JS row measuring, no new dependencies (AGENTS.md).
- `pre` and `blockquote` stay atomic; revisiting them is a potential
  follow-up, not part of this ticket.
- Safari's missing `<thead>` repetition (WebKit #17205) is accepted as
  best-effort; splitting still works there.

## Scope

- Modified: `assets/mdopen.css` (print block only).

## Acceptance criteria

- [x] A document with heading + sentence + long table starts the table right
      after the sentence, fills the rest of the page, and continues on the
      next page.
- [x] The header row repeats at the top of each printed page the table
      spans (Chrome/Firefox).
- [x] No row is ever sliced in half across a page boundary.
- [x] `pre` and `blockquote` still refuse to split.
- [x] Screen rendering unchanged (print rules only).
- [x] `bun run check`, `bun test`, and the renderer smoke test pass.
- [x] Verified in browser print preview with a 20+ row table.

## Verification (2026-09-25)

Verified in headless Chromium via `page.pdf()` on the real rendered output
(all mdopen stylesheets served; print-media emulation confirmed
`.mdopen-toolbar`/`.mdopen-github-link` hidden, `table` computed
`break-inside: auto`, `thead` computed `table-header-group`):

- 22-row demo (heading + sentence mid-page, table taller than the space
  left, shorter than a full page): old CSS pushes the whole table to
  page 2 leaving most of page 1 empty; new CSS renders the header row and
  D01-D16 on page 1 down to the bottom margin, page 2 opens with the
  repeated header row, D17-D22, and the closing sentence. Clean row
  boundary between D16/D17.
- 30-row table: splits at R19/R20 with the header repeated on page 2.
- `bash -n bin/mdopen`, `bun run check` (byte-for-byte CLI baseline),
  `bun test` (20/20), renderer smoke test all pass.

Note: Chromium ignores `break-inside: avoid` on tables taller than one
full page, so very long tables already split before this change; the fix
matters for tables that fit a page but not the remaining space.

## References

- MDOP-006 — research and rationale
