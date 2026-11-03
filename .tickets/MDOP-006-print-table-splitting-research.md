---
code: MDOP-006
status: Implemented
dateCreated: 2026-09-25T12:36:44.000Z
type: Research
priority: Medium
phaseEpic: MDOP-005
---

# MDOP-006: Print table splitting — research

## Question

What is the best practice for splitting HTML content smartly across printed
pages — specifically, making tables fill the remaining page and continue on
the next page with the header row repeated (Excel behavior), instead of the
whole table jumping to the next page?

## Root cause

`@media print` in `assets/mdopen.css` (around line 1145) applies a blanket:

```css
pre, blockquote, table {
  break-inside: avoid;
}
```

so any table that does not fit in the space left on the page is moved
wholesale to the next page, wasting sheet space.

## Findings (2026-09-25)

- The Excel behavior is achievable with pure CSS; no JavaScript and no
  dependencies needed. This is the established best-practice pattern:
  1. Let tables flow across pages: `table { break-inside: auto; }`
     (remove the blanket `avoid` for tables only).
  2. Repeat the header row on every printed page:
     `thead { display: table-header-group; }` (and
     `tfoot { display: table-footer-group; }`). Browsers re-render `<thead>`
     at the top of every page fragment the table spans.
  3. Keep rows atomic: `tr { break-inside: avoid; }` so a row is never
     sliced mid-row. Also the documented fix for Chrome's historical
     thead-repetition quirk.
  4. Keep `h1–h6 { break-after: avoid-page }` (already present) so headings
     are not stranded at the bottom of a page.
- mdopen's rendered HTML already has the required structure: markdown-it
  emits `<table><thead><tr><th>…` by default (verified by rendering a sample
  through `renderer.js`).
- Browser support: Chrome and Firefox handle splitting + thead repetition
  correctly. Safari has a long-standing bug (WebKit #17205) and may not
  repeat `<thead>` on print; splitting itself still works. Legacy
  `page-break-inside` aliases are worth keeping as fallback.
- Tiny tables (2–4 rows) can now straddle a page break; pure CSS cannot
  select by height, and the accepted trade-off in print guides is to allow
  it. JS measuring (Paged.js-style) was considered and rejected: new
  complexity/dependency for marginal gain, against AGENTS.md rules.
- `border-collapse: collapse` (already used) renders clean borders at the
  split point.

## Conclusion

Implement the pattern above in the `@media print` block of
`assets/mdopen.css`; keep `pre, blockquote { break-inside: avoid }` for now.
Tracked as MDOP-007.

## References

- MDN, [Using CSS to print](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fragmentation/Printing)
- MDN, [page-break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/page-break-inside)
- [WebKit bug 17205 — thead repetition on print](https://bugs.webkit.org/show_bug.cgi?id=17205)
- [OpenReplay — CSS for Print](https://blog.openreplay.com/css-for-print/)
- [pdf4.dev — CSS print styles guide](https://pdf4.dev)
