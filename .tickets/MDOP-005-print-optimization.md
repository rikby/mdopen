---
code: MDOP-005
status: Approved
dateCreated: 2026-09-25T12:36:44.000Z
type: Epic
priority: Medium
level: epic
---

# MDOP-005: Print optimization

## Problem

Printed output wastes sheet space. When a heading and a line of text are
followed by a table too tall for the space left on the page, the print
stylesheet's blanket `break-inside: avoid` on tables pushes the whole table
to the next page, leaving a large gap. Print pagination should behave like
Excel: content starts where it is, fills the page, and continues on the next
page with table header rows repeated.

## Goal

Use sheet space effectively in printed/PDF output through pure-CSS print
fragmentation rules — no new runtime dependencies, no changes to screen
rendering.

## Scope

- **In scope**: table pagination (split across pages, repeat header rows per
  page, keep rows atomic); print fragmentation polish directly tied to it.
- **Out of scope**: print UI controls, PDF generation, changing screen
  rendering, JS-based pagination measurement.

## Child tickets

| Code | Title | Type | Status |
|------|-------|------|--------|
| MDOP-006 | Print table splitting — research | Research | Completed |
| MDOP-007 | Excel-style table splitting in print CSS | Feature Enhancement | Implemented |

## Candidate follow-ups (not ticketed)

- `pre` and `blockquote` keep `break-inside: avoid`; long code blocks can
  still cause the same gap. Decide later whether to keep them atomic
  (current: keep — atomic reading units).
- Safari does not always repeat `<thead>` when printing (WebKit bug 17205);
  splitting still works there, header repetition is best-effort.

## References

- MDOP-006 (root-cause analysis, recommended CSS pattern, browser caveats)
- MDOP-007 (implementation of the researched pattern in `assets/mdopen.css`)
