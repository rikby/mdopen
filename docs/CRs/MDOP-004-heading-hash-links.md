---
code: MDOP-004
status: Implemented
dateCreated: 2026-09-24T14:41:32.182Z
type: Feature Enhancement
priority: Medium
---

# MDOP-004: Add heading anchors and shareable hash links

## 1. Description

### Requirements Scope
`full`

### Problem
- Rendered documents cannot be deep-linked: no way to share a URL that opens a specific file, let alone a specific section.
- Headings in rendered HTML have no `id` and are not clickable (no GitHub-style anchor links).
- Directory viewer always opens at the index; there is no URL state for the selected file.

### Affected Artifacts
- `renderer.js` (heading slug + anchor post-process, single-file path)
- `bin/mdopen.js` (viewer heading anchors, `#path--slug` hash routing)
- `scripts/build-binary.js` (mirror of viewer changes; single-file anchors come from embedded `renderer.js`)
- `assets/mdopen.css` (heading link styles, scroll-margin)
- `test/renderer.test.js`, `test/directory-viewer.test.js`
- `docs/design/surfaces/directory-viewer.spec.md`, `CHANGELOG.md`

### Scope
- **Changes**: GitHub-style heading anchors (unicode-aware slug, dedupe with `-N`, whole-title clickable); shareable hashes — single file `#{slug}` (native anchors), viewer `#{path}--{slug}` (split at first `--`); viewer hash routing with back/forward support.
- **Unchanged**: no new dependencies; Pages editor behavior; print output; existing toolbar/menu features.

## 2. Decision

### Chosen Approach
Post-process rendered headings to inject `id` + wrap content in a self-referencing link (markdown-ticket's slugify algorithm, markdown-it-anchor's permalink pattern) without adding a dependency.

### Rationale
- renderer.js already post-processes callouts; same insertion point, zero new runtime requirements.
- Slug algorithm is copied verbatim from markdown-ticket (`slugify.ts`), proven against GitHub-style titles.

## 3. Alternatives Considered

| Approach | Key Difference | Why Rejected |
|----------|---------------|--------------|
| **Heading post-process + hash routing in viewer script** | No new deps; one regex pass | **ACCEPTED** - matches existing callout post-process pattern |
| `markdown-it-anchor` plugin | battle-tested permalink logic | New runtime dependency for ~30 lines of replaceable logic |
| Query params (`?file=`) instead of hash | Server-friendly | Hash survives static hosting and file:// and needs no redirect logic |

## 4. Artifact Specifications

### New Artifacts

| Artifact | Type | Purpose |
|----------|------|---------|
| none | — | contained in existing files |

### Modified Artifacts

| Artifact | Change Type | Modification |
|----------|-------------|--------------|
| `renderer.js` | function added | `slugifyHeading(text)` (lowercase, split on whitespace, strip non `\p{L}\p{N}-`, join with `-`, entity decode) and `addHeadingAnchors(html)` (per-document dedupe `-1`/`-2`, wraps heading content in `a.mdopen-heading-link[href="#slug"]`, sets `id`) |
| `bin/mdopen.js` | viewer script | same anchors applied per rendered file; hash routing: file buttons set `#path`, heading links set `#path--slug`, `hashchange` routes (open file, scroll to heading); back/forward supported |
| `scripts/build-binary.js` | mirror | minified viewer routing + anchors |
| `assets/mdopen.css` | styles added | heading link inherits color, hover `#` glyph, `scroll-margin-top` for anchored headings, hidden in print |

### Integration Points

| From | To | Interface |
|------|----|-----------|
| `bin/mdopen.js` viewer | renderer contract | unchanged; anchors applied client-side to rendered article HTML |
| hash | viewer router | `#path--slug` (first `--` splits; slug may contain `--`); empty hash = index |

### Key Patterns
- Hash routing is the single source of navigation state; buttons only mutate the hash (history back/forward works for free).

## 5. Acceptance Criteria

### Functional
- [x] Rendered headings h1-h6 carry `id` and a clickable full-title link
- [x] Duplicate headings get `-1`, `-2` suffixes; unicode letters are preserved in slugs
- [x] Single file: browser-native `#slug` links jump and are shareable
- [x] Viewer: opening `#path--slug` renders that file and scrolls to the heading
- [x] Viewer: clicking a heading updates the hash to `#path--slug`; selecting a file sets `#path`; Index clears it
- [x] Browser back/forward navigates viewer history
- [x] Anchors are invisible until heading hover; print output unaffected
- [x] The current document's nav button is highlighted (accent tint + inset bar + semibold), visually distinct from hover, following light/dark theme

### Amendment (post-implementation)

- Current-document highlight in the nav tree strengthened: hover stays neutral gray; `aria-current="page"` now gets an accent-tinted background (`color-mix` on `--mdopen-preview-accent-link`, theme-aware), an inset 2px accent bar, and a semibold label. Mirrored in the binary.
- Handle moved inside the nav frame: it replaces the panel's right border (nav `overflow: hidden` + inner scroll wrapper keep it pinned under the rounded corners and clear of the scrollbar); panel hit-area concern resolved by the 12px padding gap.
- Tree nav and preview restructured into a flex shell (`.mdopen-shell`): the resize handle is an in-layout 1px sibling line (shadcn resizable-handle pattern) instead of a fixed floating element, so it always sits on the panel edge and cannot overlap content; width capped at `min(45vw, 100vw - 160px)` so the toolbar stays reachable. Mirrored in the binary.
- Tree block gets a practical UI sans font stack (independent of the document font theme) and a user-resizable width: right-edge drag handle (pointer) plus ArrowLeft/ArrowRight on the focused handle, range 180px-100vw-96px, persisted in `localStorage` (`mdopen-directory-width`); the article margin tracks `--mdopen-nav-width`. Hidden on mobile and in print. Mirrored in the binary.

### Non-Functional
- [x] No new runtime dependencies
- [x] Same behavior in CLI, standalone binary, and Pages single-file output

### Testing
- Unit: `test/renderer.test.js` — slug ids, dedupe, unicode, link wrapping
- Unit: `test/directory-viewer.test.js` — generator contains routing + anchor markers
- Manual: agent-browser — click heading → hash; open shared hash URL → file + scroll; back/forward

## 6. Verification

### By CR Type
Feature: headings carry anchors in single-file and viewer output; hash URLs route; `bun test` passes; agent-browser walkthrough confirms click/share/back-forward.

### Metrics
Not applicable.

## 7. Deployment

### Simple Changes
- Source-only change; binary picks up `renderer.js` and mirrored viewer script at next `bun run build:binary`.