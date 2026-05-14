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

## Open — Editing Mode (desktop)

```wireframe
┌──────────────────────────────────────────────────────────────┐
│ .mdopen-toolbar               [✏️] [☀] [⧉] [🖨] [☰]        │
├──────────────────────┬───────────────────────────────────────┤
│ .mdopen-editor-panel │                                       │
│  (40%)               │  <article class="markdown-body">      │
│                      │   (60%)                               │
│ ┌──────────────────┐ │                                       │
│ │ <textarea>       │ │  # Rendered Document                  │
│ │                  │ │                                       │
│ │ # Hello World    │ │  <h1>Hello World</h1>                 │
│ │                  │ │                                       │
│ │ Some **bold**    │ │  <p>Some <strong>bold</strong>        │
│ │ text here.       │ │  text here.</p>                       │
│ │                  │ │                                       │
│ │ - list item      │ │  <ul><li>list item</li></ul>          │
│ │ - another item   │ │                                       │
│ │                  │ │                                       │
│ │                  │ │                                       │
│ └──────────────────┘ │                                       │
│                      │  updates after 1s of inactivity       │
├──────────────────────┤                                       │
│       border-right ──→                                       │
└──────────────────────┴───────────────────────────────────────┘
```

## Pencil Active (hover/pressed state)

```wireframe state:editor-toggle active
┌──────────────────────────────────────────────────────────────┐
│                              [✏️] [☀] [⧉] [🖨] [☰]          │
│                                           ▲                  │
│                                    aria-pressed="true"       │
│                                    button highlighted        │
└──────────────────────────────────────────────────────────────┘
```

## Mobile — Vertical Stack (`< 768px`)

```wireframe viewport:mobile
┌────────────────────────────────┐
│ [✏️][☀][⧉][🖨][☰]             │
├────────────────────────────────┤
│ .mdopen-editor-panel (50% ht)  │
│                                │
│ <textarea>                     │
│                                │
│ # Hello World                  │
│ Some **bold** text             │
│                                │
├────────────────────────────────┤
│ <article> preview (50% ht)    │
│                                │
│ <h1>Hello World</h1>           │
│                                │
│ <p>Some <strong>bold</strong> │
│ text</p>                       │
│                                │
└────────────────────────────────┘
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
| Pencil button | existing toolbar tokens | `.mdopen-editor-button` | Same size/style as other toolbar buttons |
| Preview article | — | `.markdown-body` | Unchanged, just narrower |
