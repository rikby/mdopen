# Implementation Plan: Editor Page for GitHub Pages

## Goal
Add a client-side Markdown editor to mdopen's GitHub Pages site. The editor is a slide-in panel toggled by a pencil button in the toolbar. It uses CDN-loaded markdown-it + highlight.js to render live previews after 1s of inactivity.

## Critical Constraint
**GitHub Pages only.** The editor must NOT be included in the binary build (`build-binary.js`). The binary embeds templates and scripts at compile time — editor CDN scripts and the pencil button have no place there.

## Files to Create
1. `templates/editor-script.html` — browser-side script: CDN loading, markdown-it init, textarea binding, debounce rendering, mermaid lazy-load
2. `assets/editor.css` — editor panel layout, textarea styling, responsive rules (scoped under `.mdopen-editor-panel`)

## Files to Modify
3. `templates/mdopen.html` — add pencil button in toolbar, add `{{editorScript}}` placeholder, add `data-mdopen-editor` attribute on body, load `editor.css`
4. `scripts/build-pages.js` — generate `edit.html` (pre-activated editor with sample content), copy `editor.css` to `_site/`
5. `scripts/build-binary.js` — no changes needed (already ignores editor files since they're not referenced in the binary template)
6. `AGENTS.md` — add note: editor is GitHub Pages only, not in binary
7. `ARCHITECTURE.md` — add editor section describing the GitHub Pages only scope

## Implementation Steps

### Step 1: `assets/editor.css`
- `.mdopen-editor-panel` — fixed-width left panel (40% on desktop, 50% height on mobile)
- `.mdopen-editor-panel textarea` — full size, monospace font, code styling
- `.mdopen-editor-button` — pencil button in toolbar (same style as other toolbar buttons)
- Print: hide editor panel
- Responsive: vertical stack on mobile
- Body class `.mdopen-editor-open` shifts article to 60% width

### Step 2: `templates/editor-script.html`
- CDN script loading (markdown-it, highlight.js, plugins) — only when pencil opens
- markdown-it init with same config as `renderer.js`
- Same `enhanceHtml()` callout regex
- Textarea input listener with 1s debounce
- Mermaid lazy detection and loading
- Pencil button toggle logic
- Sample content constant (~15 lines)

### Step 3: `templates/mdopen.html` changes
- Add pencil button between PrintButton and MenuButton
- Add `{{editorScript}}` placeholder (empty string for CLI pages, editor script for edit.html)
- Add `editor.css` link (only when editor is available, or always loaded — it's small)
- The pencil button should be hidden on CLI-rendered pages and shown only on pages built by build-pages. Use a class or the `{{editorScript}}` being non-empty to control visibility.

### Step 4: `scripts/build-pages.js` changes
- Copy `editor.css` to `_site/`
- Generate `edit.html` with:
  - Pre-filled sample Markdown content in the template
  - `{{editorScript}}` replaced with the editor script content
  - `{{defaultStyle}}` = "default"
  - Pencil button visible and pre-activated
- For `index.html` and `demo.html`: `{{editorScript}}` = empty string, pencil button hidden

### Step 5: Verify binary exclusion
- Confirm `build-binary.js` does NOT copy `editor.css` or include `editor-script.html`
- Confirm CLI `mdopen.js` does NOT reference editor files
- Run `bun run check` — should pass unchanged
- Run `bun run build:binary` — should produce same binary as before

### Step 6: Documentation updates
- `AGENTS.md` — add: "Editor is GitHub Pages only, not included in binary builds"
- `ARCHITECTURE.md` — add editor section under a GitHub Pages heading

### Step 7: Test
- `bun run check` passes
- `bun run build:pages` generates `_site/edit.html`, `_site/index.html`, `_site/demo.html`
- `edit.html` loads in browser, pencil is active, sample content renders
- Typing in textarea updates preview after 1s
- Code blocks get syntax highlighting
- Pencil toggle hides/shows panel
- Toolbar controls (theme, font, etc.) work on editor page
- Print hides editor panel
- Mobile: vertical stack layout
- `index.html` and `demo.html` show no pencil button
- Binary build unchanged

## Testing Strategy
No unit test framework exists in this project. Tests are:
1. `bun run check` — existing syntax/render check
2. `bun run build:pages` — build succeeds
3. `bun run build:binary` — binary unchanged
4. Manual browser QA of edit.html (automated via browse skill if available)
