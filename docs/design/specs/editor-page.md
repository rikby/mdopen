# Editor Page

A toolbar-activated editor panel that renders a live Markdown preview using the same markdown-it pipeline as the CLI renderer. Not a separate page — an overlay mode of the existing rendered page. Triggered by a pencil button in the toolbar.

## Composition

```text
EditorPanel (overlay, toggled by pencil button)
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
| CSS additions | `assets/mdopen.css` (editor panel rules, scoped) |
| Styling guide | `docs/styling.md` |

## Layout

### Pencil closed (default reading mode)

- Page renders exactly as it does now — full-width `<article>`, no editor visible.
- Pencil button sits in the toolbar as the leftmost button, before the theme toggle.

### Pencil open (editing mode)

- Editor panel slides in from the left, taking 40% of viewport width.
- The existing `<article>` shrinks to fill the remaining 60%.
- Both panes scroll independently.
- Pencil button stays in toolbar with `aria-pressed="true"`.

### Mobile (`< 768px`)

- Editor panel stacks vertically: editor on top (50% height), preview below (50% height).
- No horizontal split on mobile.

## EditorPane

- `<textarea>` filling the panel.
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

## Children

| Child | Component | Spec | Conditional |
|-------|-----------|------|-------------|
| EditorToggle | toolbar button | this spec | always visible |
| EditorPane | `<textarea>` in side panel | this spec | when pencil open |
| Preview | existing `<article class="markdown-body">` | — | always |

## States

| State | Trigger | Visual change |
|-------|---------|---------------|
| closed | page load, pencil click when open | full-width article, no editor panel |
| open | pencil click | editor panel slides in left, article shrinks to 60% |
| typing | user types in textarea | no immediate change; render fires after 1s inactivity |
| rendered | debounce fires | article content updates |
| mermaid-needed | mermaid fence in content | Mermaid CDN loaded; diagrams render once ready |
| print | browser print | editor panel hidden; article prints full-width as normal |

## Initial content

When the editor opens on a page with no existing content (e.g. a fresh `edit.html`), the textarea is pre-filled with ~15 lines of sample Markdown demonstrating headings, bold/italic, code, lists, blockquote, and a link.

When the editor opens on an existing rendered page (future enhancement), the textarea could be pre-filled with the source Markdown if available.

## Tokens used

| Element | Token | Usage |
|---------|-------|-------|
| editor background | `--bgColor-default` | panel and textarea background |
| editor text | `--fgColor-default` | textarea text |
| editor font | `--mdopen-font-code` | monospace editing font |
| panel border | `--borderColor-default` | right border of editor panel |

## Classes used

| Element | Class | Source |
|---------|-------|-------|
| editor panel | `.mdopen-editor-panel` | proposed |
| pencil button | `.mdopen-editor-button` | proposed, in toolbar |
| toolbar | `.mdopen-toolbar` | existing |
| article | `.markdown-body` | existing |

Editor-only CSS is scoped under `.mdopen-editor-panel` and does not affect existing rendered pages.

## Extension notes

- Do not add an editor framework. Plain textarea is intentional.
- CDN scripts load only when the editor opens, not on every page.
- The `build:pages` script should generate `edit.html` that opens with the pencil pre-activated and sample content loaded.
- No localStorage persistence. No URL params for content.
- The editor is a page mode, not a separate application.
