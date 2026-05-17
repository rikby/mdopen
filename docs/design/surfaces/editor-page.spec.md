# Editor Page

A toolbar-activated editor panel that renders a live Markdown preview using the same markdown-it pipeline as the CLI renderer. Not a separate page — an overlay mode of the existing rendered page. Triggered by a pencil button in the toolbar.

Includes optional file system integration via the File System Access API (Chromium browsers only). This is a progressive enhancement — the editor works fully without it.

## Composition

```text
EditorPanel (overlay, toggled by pencil button)
├── EditorHeader
│   ├── BackLink (← mdopen)
│   ├── FileOpenButton (Chromium only)
│   └── FileSaveButton (Chromium only, when file open)
├── EditorPane
│   └── Textarea
└── (preview is the existing <article class="markdown-body">)
```

The pencil button is added to the existing toolbar composition:

```text
Toolbar
├── EditorToggle  ← new, leftmost
├── ThemeToggle
├── CopyRichButton
├── PrintButton
├── MenuButton
└── MenuPanel
```

## Source files

| Type | Path |
|------|------|
| Template | `templates/mdopen.html` (add pencil button) |
| Editor script | `templates/editor-script.html` (new) |
| CSS additions | `assets/editor.css` (editor panel rules, scoped) |
| Styling guide | `docs/styling.md` |

## Layout

### Pencil closed (default reading mode)

- Page renders exactly as it does now — full-width `<article>`, no editor visible.
- Pencil button sits in the toolbar as the leftmost button, before the theme toggle.

### Pencil open (editing mode)

- Editor panel slides in from the left, default 40% of viewport width. Resizable via divider.
- The existing `<article>` shrinks to fill the remaining 60%.
- Both panes scroll in sync: editor scroll anchors on the nearest heading visible in the textarea, then scrolls preview to that heading.
- Pencil button stays in toolbar with `aria-pressed="true"`.

### Mobile (`< 768px`)

- Editor panel stacks vertically: editor on top (50% height), preview below (50% height).
- Scroll sync still works on mobile.
- No horizontal split on mobile.

## State persistence

- Editor content (textarea value), file handle, and dirty state are preserved in memory when the editor is closed and reopened.
- Closing the pencil does not discard work. Reopening restores the exact content.
- File handle survives close/reopen (still in memory). Ctrl+S still writes to the same file.
- Full page refresh loses everything (no localStorage, no IndexedDB).

## Scroll sync

- Editor scroll position drives preview scroll by anchoring on headings.
- markdown-it `heading_open` rule adds `data-source-line` attributes to all headings with the source line number.
- On scroll: calculate approximate top-visible line in textarea, find the heading whose `data-source-line` is closest, scroll preview to that heading's offset.
- Sync is one-directional: editor → preview. Preview does not feed back to editor.
- This keeps the visible preview section aligned with what the user is editing.

## Resizable divider

- A 6px-wide drag handle sits between editor panel and preview.
- Positioned at the panel's right edge, full height.
- Cursor: `col-resize`. Hover shows subtle background color.
- Dragging updates panel and preview widths via inline styles (min 20%, max 80%).
- Width is stored in `panelWidth` variable and persists across close/reopen in the same session.
- Hidden on mobile (fixed 50/50 vertical stack).
- Hidden in print.

## EditorHeader

A thin bar at the top of the editor panel, above the textarea.

| Element | Content | Position | Conditional |
|---------|---------|----------|-------------|
| BackLink | `← mdopen` | left | always |
| FileOpenButton | `📂 Open` | right of back link | Chromium only |
| FileSaveButton | `💾 Save` | right of open button | Chromium + file handle held |
| Dirty indicator | `•` (dot) after filename | beside save button | content differs from disk |

- **BackLink**: links to `https://rikby.github.io/mdopen/`.
- **FileOpenButton**: calls `showOpenFilePicker()` with `.md`/`.markdown` filter. Visible only when `'showOpenFilePicker' in window` (Chromium). Hidden in Firefox/Safari.
- **FileSaveButton**: writes textarea content back to the stored file handle via `handle.createWritable()`. Hidden until a file has been opened. When file handle exists and content is clean, button shows but is visually muted (no dot).
- **Dirty indicator**: a small dot `•` appears beside the save button (or in the header) when the textarea content differs from what was last loaded or saved. Disappears after save.

### Keyboard shortcut

- `Ctrl+S` / `Cmd+S`: save to stored file handle. If no handle, does nothing (no Save As prompt — the user must open a file first).
- `Ctrl+O` / `Cmd+O`: trigger file open picker.

## EditorPane

- `<textarea>` filling the panel below the header.
- Monospace font using `--mdopen-font-code` token.
- Background: `--bgColor-default`, text: `--fgColor-default`.
- Padding: `16px`.
- Tab key inserts two spaces.
- No line numbers.

## Rendering

Identical pipeline to `renderer.js`:

1. User types in textarea.
2. After 1 second of inactivity, `markdownIt.render(text)` runs.
3. Output passes through the same `enhanceHtml()` callout regex.
4. Mermaid fences detected; Mermaid CDN lazy-loaded on first encounter.
5. Result replaces `<article class="markdown-body">` innerHTML.

Differences from CLI renderer:

| Feature | CLI `renderer.js` | Editor renderer |
|---------|-------------------|-----------------|
| Image path resolution | resolves against input dir | skipped; URL images only |
| Rendering trigger | CLI invocation | 1s debounce on textarea input |

### CDN dependencies

| Library | Source | Gzipped |
|---------|--------|---------|
| markdown-it | jsDelivr | ~45 KB |
| highlight.js (common) | cdnjs | ~25 KB |
| markdown-it plugins (6) | jsDelivr | ~6 KB total |
| Mermaid | jsDelivr | ~1 MB, lazy-loaded only if mermaid fence detected |

Total upfront: ~75 KB. Loaded only when editor opens, not on every page load.

## File System Access

Uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to read and write local `.md` files directly. This API is only available in Chromium-based browsers (Chrome, Edge, Opera). Firefox and Safari have no plans to support it.

### Feature detection

```js
var hasFileSystem = 'showOpenFilePicker' in window;
```

All file-related UI is conditionally rendered based on this check.

### Browser support

| Browser | Open | Save | Ctrl+S |
|---------|------|------|--------|
| Chrome 86+ | ✅ | ✅ | ✅ |
| Edge 86+ | ✅ | ✅ | ✅ |
| Safari | ❌ | ❌ | ❌ |
| Firefox | ❌ | ❌ | ❌ |
| Mobile browsers | ❌ | ❌ | ❌ |

### Open flow

1. User clicks `📂 Open` or presses `Ctrl+O`.
2. `showOpenFilePicker()` called with `.md`/`.markdown` accept filter.
3. User selects a file in the native OS picker.
4. File handle stored in memory. File content read via `handle.getFile()` → `file.text()`.
5. Content loaded into textarea. Dirty flag cleared.
6. Preview renders from the loaded content.

### Save flow

1. User clicks `💾 Save` or presses `Ctrl+S`.
2. If no file handle stored: do nothing (user must open a file first).
3. If handle exists: `handle.createWritable()` → `write(textarea.value)` → `close()`.
4. Dirty flag cleared.
5. Brief visual confirmation (button flashes ✓, same pattern as copy).

### No file handle (default state)

When no file is open, the editor works purely as a scratchpad:
- Textarea shows sample content.
- Preview renders live.
- No save button visible.
- No dirty indicator.
- User can paste content or type from scratch.

This is the experience in Firefox, Safari, and all mobile browsers — and also in Chrome before opening a file.

## Children

| Child | Component | Spec | Conditional |
|-------|-----------|------|-------------|
| EditorToggle | toolbar button | this spec | always visible |
| EditorHeader | panel header bar | this spec | when pencil open |
| EditorPane | `<textarea>` in side panel | this spec | when pencil open |
| Preview | existing `<article class="markdown-body">` | — | always |

## States

| State | Trigger | Visual change |
|-------|---------|---------------|
| closed | page load, pencil click when open | full-width article, no editor panel; content preserved in memory |
| open | pencil click | editor panel slides in left, article shrinks to 60%; previous content restored |
| typing | user types in textarea | no immediate change; render fires after 1s inactivity |
| rendered | debounce fires | article content updates |
| mermaid-needed | mermaid fence in content | Mermaid CDN loaded; diagrams render once ready |
| file-opened | file picker returns | content loaded, save button appears, dirty flag cleared |
| dirty | textarea content differs from loaded file | dirty dot `•` appears in header |
| clean | save completes, or content matches disk | dirty dot disappears |
| saving | save button click or Ctrl+S | button briefly shows ✓ |
| no-file-api | non-Chromium browser | open/save buttons hidden, scratchpad-only mode |
| print | browser print | editor panel hidden; article prints full-width as normal |

## Initial content

When the editor opens on a page with no existing content (e.g. a fresh `edit.html`), the textarea is pre-filled with ~15 lines of sample Markdown demonstrating headings, bold/italic, code, lists, blockquote, a link, and a mermaid diagram.

When the editor opens on an existing rendered page (future enhancement), the textarea could be pre-filled with the source Markdown if available.

## Tokens used

| Element | Token | Usage |
|---------|-------|-------|
| editor background | `--bgColor-default` | panel and textarea background |
| editor text | `--fgColor-default` | textarea text |
| editor font | `--mdopen-font-code` | monospace editing font |
| panel border | `--borderColor-default` | right border of editor panel |
| header border | `--borderColor-default` | bottom border of editor header |
| muted text | `--fgColor-muted` | back link, file info text |

## Classes used

| Element | Class | Source |
|---------|-------|-------|
| editor panel | `.mdopen-editor-panel` | existing |
| editor header | `.mdopen-editor-header` | existing |
| editor back link | `.mdopen-editor-back` | existing |
| file open button | `.mdopen-editor-open` | proposed, in editor header |
| file save button | `.mdopen-editor-save` | proposed, in editor header |
| dirty indicator | `.mdopen-editor-dirty` | proposed, dot in header |
| pencil button | `.mdopen-editor-button` | existing, in toolbar |
| toolbar | `.mdopen-toolbar` | existing |
| article | `.markdown-body` | existing |

Editor-only CSS is scoped under `.mdopen-editor-panel` and does not affect existing rendered pages.

## Extension notes

- Do not add an editor framework. Plain textarea is intentional.
- CDN scripts load only when the editor opens, not on every page.
- The `build:pages` script generates `edit.html` that opens with the pencil pre-activated and sample content loaded.
- No localStorage persistence. No URL params for content.
- The editor is a page mode, not a separate application.
- File System Access is a progressive enhancement. The editor must work fully without it.
- The file handle lives only in memory. Refreshing the page loses it (no IndexedDB handle persistence for now).
- Do not add drag-and-drop file import unless there is a concrete user request.
