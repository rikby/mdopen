# Editor Page — Wireframe Schema

Related spec: `docs/design/specs/editor-page.md`

## Closed — Normal Reading Mode

```wireframe
┌──────────────────────────────────────────────────────────────┐
│ .mdopen-toolbar               [✏️] [☀] [⧉] [🖨] [☰]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  <article class="markdown-body">                             │
│                                                              │
│  # Rendered Document                                         │
│                                                              │
│  Full width. Normal reading experience.                      │
│  No editor visible.                                          │
│                                                              │
│  Pencil toggles editor panel.                                │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Open — Editing Mode, Scratchpad (desktop, no file open)

Default state. No file loaded. Works in all browsers.

```wireframe
┌──────────────────────────────────────────────────────────────┐
│ .mdopen-toolbar               [✏️] [☀] [⧉] [🖨] [☰]        │
├──────────────────────┬───────────────────────────────────────┤
│ .mdopen-editor-panel │                                       │
│  (40%)               │  <article class="markdown-body">      │
│ ┌──────────────────┐ │   (60%)                               │
│ │ ← mdopen         │ │                                       │
│ ├──────────────────┤ │  # Rendered Document                  │
│ │ <textarea>       │ │                                       │
│ │                  │ │  <h1>Hello World</h1>                 │
│ │ # Hello World    │ │                                       │
│ │                  │ │  <p>Some <strong>bold</strong>        │
│ │ Some **bold**    │ │  text here.</p>                       │
│ │ text here.       │ │                                       │
│ │                  │ │                                       │
│ │                  │ │                                       │
│ │                  │ │                                       │
│ └──────────────────┘ │                                       │
│                      │  updates after 1s of inactivity       │
└──────────────────────┴───────────────────────────────────────┘
  No open/save buttons (no file handle)
```

## Open — File Loaded, Clean (Chromium only)

File has been opened via `showOpenFilePicker()`. Content matches disk.

```wireframe state:editor-file-clean
┌──────────────────────────────────────────────────────────────┐
│ .mdopen-toolbar               [✏️] [☀] [⧉] [🖨] [☰]        │
├──────────────────────┬───────────────────────────────────────┤
│ ┌──────────────────┐ │                                       │
│ │ ← mdopen  📂 💾  │ │  <article class="markdown-body">      │
│ ├──────────────────┤ │                                       │
│ │ <textarea>       │ │  Content from local file renders      │
│ │                  │ │  here with live preview.               │
│ │ # Local Doc      │ │                                       │
│ │                  │ │  <h1>Local Doc</h1>                    │
│ │ Content from     │ │                                       │
│ │ disk file.       │ │  <p>Content from disk file.</p>        │
│ │                  │ │                                       │
│ └──────────────────┘ │                                       │
└──────────────────────┴───────────────────────────────────────┘
   📂 = Open    💾 = Save (muted, content matches disk)
```

## Open — File Loaded, Dirty (Chromium only)

User has edited the textarea. Content differs from what's on disk.

```wireframe state:editor-file-dirty
┌──────────────────────────────────────────────────────────────┐
│ .mdopen-toolbar               [✏️] [☀] [⧉] [🖨] [☰]        │
├──────────────────────┬───────────────────────────────────────┤
│ ┌──────────────────┐ │                                       │
│ │ ← mdopen 📂 💾•  │ │  <article class="markdown-body">      │
│ ├──────────────────┤ │                                       │
│ │ <textarea>       │ │  Preview shows modified content.      │
│ │                  │ │                                       │
│ │ # Local Doc      │ │                                       │
│ │                  │ │                                       │
│ │ Edited content   │ │                                       │
│ │ not yet saved •  │ │                                       │
│ │                  │ │                                       │
│ └──────────────────┘ │                                       │
└──────────────────────┴───────────────────────────────────────┘
   • = dirty indicator (content differs from disk)
   💾 = Save (active, clickable)
```

## Open — Saving (brief flash)

```wireframe state:editor-saving
┌──────────────────────────────────────────────────────────────┐
│ .mdopen-toolbar               [✏️] [☀] [⧉] [🖨] [☰]        │
├──────────────────────┬───────────────────────────────────────┤
│ ┌──────────────────┐ │                                       │
│ │ ← mdopen 📂  ✓   │ │  Content written to disk.             │
│ ├──────────────────┤ │  Dirty dot gone.                      │
│ │ <textarea>       │ │                                       │
│ └──────────────────┘ │                                       │
└──────────────────────┴───────────────────────────────────────┘
   ✓ replaces 💾 briefly, then reverts. Same pattern as copy.
```

## Mobile — Vertical Stack (`< 768px`)

```wireframe viewport:mobile
┌────────────────────────────────┐
│ [✏️][☀][⧉][🖨][☰]             │
├────────────────────────────────┤
│ .mdopen-editor-panel (50% ht)  │
│ ┌────────────────────────────┐ │
│ │ ← mdopen                   │ │
│ ├────────────────────────────┤ │
│ │ <textarea>                 │ │
│ │                            │ │
│ │ # Hello World              │ │
│ │ Some **bold** text         │ │
│ └────────────────────────────┘ │
├────────────────────────────────┤
│ <article> preview (50% ht)    │
│                                │
│ <h1>Hello World</h1>           │
│                                │
│ <p>Some <strong>bold</strong> │
│ text</p>                       │
│                                │
└────────────────────────────────┘
 File buttons hidden on mobile (no file API)
```

## Print State

```wireframe state:editor-page print
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  <article class="markdown-body">                             │
│                                                              │
│  Editor panel hidden. Full-width article.                    │
│  Toolbar hidden. Same print behavior as normal pages.        │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Annotations

| Element | Token / Color | Class / Pattern | Notes |
|---------|---------------|-----------------|-------|
| Editor panel bg | `--bgColor-default` | `.mdopen-editor-panel` | Matches page background |
| Editor text | `--fgColor-default` | `.mdopen-editor-panel textarea` | Default foreground |
| Editor font | `--mdopen-font-code` | `.mdopen-editor-panel textarea` | Monospace, follows font theme |
| Panel border | `--borderColor-default` | `.mdopen-editor-panel` | Right border, 1px solid |
| Header border | `--borderColor-default` | `.mdopen-editor-header` | Bottom border, 1px solid |
| Back link | `--fgColor-muted` | `.mdopen-editor-back` | De-emphasized |
| File open button | `--fgColor-default` | `.mdopen-editor-open` | Chromium only, in header |
| File save button | `--fgColor-default` | `.mdopen-editor-save` | Chromium + file handle held |
| Dirty dot | `--fgColor-muted` | `.mdopen-editor-dirty` | Small dot, muted color |
| Pencil button | existing toolbar tokens | `.mdopen-editor-button` | Same size/style as other toolbar buttons |
| Preview article | — | `.markdown-body` | Unchanged, just narrower |
