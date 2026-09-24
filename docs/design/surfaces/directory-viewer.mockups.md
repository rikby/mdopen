# Directory Viewer — Wireframe Schema

Related spec: directory-viewer.spec.md

## Desktop — Index State

Tree nav with collapsible folder groups (`details`/`summary`) and the toolbar's file-list toggle (🗂):

```wireframe
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   [🗂] [☀] [⧉] [🖨] [☰]                      │
│ ┌──────────────────────────┐                                                 │
│ │ mdopen                   │   <article class="markdown-body">               │
│ │ ───────────────────────  │                                                 │
│ │ ▸ Index                  │   # mdopen                                      │
│ │ ▾ docs                   │                                                 │
│ │   │ ▸ inner              │   16 Markdown files found.                      │
│ │   │ styling.md           │                                                 │
│ │   │ binaries.md          │   - docs/styling.md                             │
│ │ ▸ examples               │   - docs/binaries.md                            │
│ │   AGENTS.md              │   - examples/demo.md                            │
│ │   ARCHITECTURE.md        │   - AGENTS.md                                   │
│ │   README.md              │   - ARCHITECTURE.md                             │
│ └──────────────────────────┘   - README.md                                   │
│                                                                   MDopen ◈   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Desktop — File Selected

```wireframe state:directory-file-selected
┌──────────────────────────────────────────────────────────────────────────────┐
│                                      [☀] [⧉] [🖨] [☰]                       │
│ ┌──────────────────────────┐                                                 │
│ │ mdopen                   │   <article class="markdown-body">               │
│ │ ───────────────────────  │                                                 │
│ │   Index                  │   # Styling Guide                               │
│ │ ▸ docs/styling.md        │                                                 │
│ │   docs/binaries.md       │   mdopen uses a small CSS cascade, one HTML     │
│ │   examples/demo.md       │   shell template, and focused script partials.  │
│ │   AGENTS.md              │                                                 │
│ │   ARCHITECTURE.md        │   ## Files                                      │
│ │   README.md              │                                                 │
│ │                          │   - assets/mdopen.css                           │
│ │                          │   - assets/mdopen-overrides.css                 │
│ └──────────────────────────┘   - templates/mdopen.html                       │
│                                                                              │
│                                                                              │
│                                                                   MDopen ◈   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Desktop — Long File List

```wireframe state:directory-long-list
┌──────────────────────────────────────────────────────────────────────────────┐
│                                      [☀] [⧉] [🖨] [☰]                       │
│ ┌──────────────────────────┐                                                 │
│ │ docs                     │   <article class="markdown-body">               │
│ │ ───────────────────────  │                                                 │
│ │ ▸ Index                  │   # Architecture                                │
│ │   adr/001-runtime.md     │                                                 │
│ │   adr/002-styling.md     │   The selected file renders here.               │
│ │   design/editor.md       │                                                 │
│ │   design/toolbar.md      │   The nav scrolls independently when there      │
│ │   guides/install.md      │   are more files than fit in the viewport.      │
│ │   guides/release.md      │                                                 │
│ │   specs/rendering.md     │                                                 │
│ │   specs/printing.md      │                                                 │
│ │   ...                    │                                                 │
│ └──────────────────────────┘                                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Mobile — Stacked Navigation

```wireframe viewport:mobile
┌────────────────────────────────────┐
│                 [☀][⧉][🖨][☰]     │
│ ┌────────────────────────────────┐ │
│ │ mdopen                         │ │
│ │ ─────────────────────────────  │ │
│ │ ▸ Index                        │ │
│ │   docs/styling.md              │ │
│ │   docs/binaries.md             │ │
│ │   examples/demo.md             │ │
│ └────────────────────────────────┘ │
│                                    │
│ <article class="markdown-body">    │
│                                    │
│ # mdopen                           │
│                                    │
│ 16 Markdown files found.           │
│                                    │
│ - docs/styling.md                  │
│ - docs/binaries.md                 │
│ - examples/demo.md                 │
│                                    │
└────────────────────────────────────┘
```

## Print State

```wireframe state:directory-print
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  <article class="markdown-body">                             │
│                                                              │
│  # Styling Guide                                             │
│                                                              │
│  The selected Markdown file prints with normal mdopen print  │
│  rules. Directory navigation and fixed chrome are hidden.    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Annotations

| Element | Token / Color | Class / Pattern | Notes |
|---------|---------------|-----------------|-------|
| Directory nav | `Canvas`, `CanvasText` | `.mdopen-directory-nav` | Fixed left on desktop, normal block on mobile |
| Active file | inherited | `[aria-current="page"]` | Same state applies to Index and file buttons |
| Preview | existing document tokens | `.markdown-body` | Reuses normal mdopen renderer surface |
| Toolbar | existing toolbar tokens | `.mdopen-toolbar` | Editor pencil stays hidden in directory mode |
| Print | existing print rules | `.mdopen-directory-nav` hidden | Selected article prints full width |
