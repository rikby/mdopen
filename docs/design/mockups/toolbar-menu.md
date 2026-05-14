# Toolbar Menu — Wireframe Schema

Related spec: `docs/design/specs/toolbar-menu.md`

## Default Closed State

```wireframe
Desktop, closed

                                    ┌──────────────────────────┐
                                    │ [☀] [⧉] [🖨] [☰]        │
                                    └──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Markdown document                                                            │
│                                                                              │
│ # Heading                                                                     │
│ Body content continues normally under the fixed toolbar.                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Open State

```wireframe state:toolbar-menu open
Desktop, open

                                    ┌──────────────────────────┐
                                    │ [☀] [⧉] [🖨] [☰]        │
                                    └───────────────┬──────────┘
                                                    │
                              ┌─────────────┴─────────────┐
                              │ Copy                 [📍] │
                              │ [Rich] [Plain] [Docs]    │
                              │ Theme                    │
                              │ [Default*] [Demo] [RTD]  │
                              │ Font                     │
                              │ [Source*] [System] [...] │
                              │ Tone                     │
                              │ [Default*] [Black] [...] │
                              │ Color                    │
                              │ [Default*] [None] [...]  │
                              │ Gap                      │
                              │ [Normal*] [-1] [-2] [-3] │
                              └───────────────────────────┘
```

## Mobile Variant

```wireframe viewport:mobile
Mobile, closed

┌──────────────────────────────────────────┐
│            [☀] [⧉] [🖨] [☰]            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Markdown document                         │
│                                           │
│ # Heading                                 │
│ Body content keeps current mobile padding.│
└──────────────────────────────────────────┘
```

## Mobile Open Variant

```wireframe viewport:mobile state:toolbar-menu open
Mobile, open

┌──────────────────────────────────────────┐
│            [☀] [⧉] [🖨] [☰]            │
├──────────────────────────────────────────┤
│ Copy                               [📍]  │
│ [Rich] [Plain text] [Google Docs]        │
│ Theme                                    │
│ [Default*] [Demo] [RTD]                 │
│ Font                                     │
│ [Source*] [System] [Balanced] [Print]   │
│ [Tech] [Editorial] [Product] [Mono]     │
│ Tone                                     │
│ [Default*] [Black] [Graphite]           │
│ [Slate] [Ash]                           │
│ Color                                    │
│ [Default*] [None] [Blue] [Sage] [Rose]  │
│ Gap                                      │
│ [Normal*] [-1] [-2] [-3]                │
└──────────────────────────────────────────┘
```

## Annotations

| Element | Token / color | Class / pattern | Notes |
|---------|---------------|-----------------|-------|
| Toolbar | `--bgColor-default`, current translucent mix | `.mdopen-toolbar` | fixed, compact, four visible controls |
| Theme toggle | `--fgColor-default` | existing `#mdopen-theme-toggle` | stays outside menu |
| Rich-copy button | `--fgColor-default` | `.mdopen-copy-rich-button` | copies rendered document HTML and text; stays outside menu |
| Print button | `--fgColor-default` | proposed `.mdopen-print-button` | calls `window.print()`; stays outside menu |
| Menu button | `--fgColor-default` | proposed `.mdopen-menu-button` | `aria-expanded` reflects open state |
| Menu panel | `--bgColor-default`, existing border mix | proposed `.mdopen-menu-panel` | hidden when closed, fixed-position popover |
| Option groups | `--fgColor-muted` labels | proposed `.mdopen-option-group` | includes Copy, Theme, Font, Tone, Color, and Gap fieldsets |
| Option buttons | existing button colors | proposed `.mdopen-segmented`, `.mdopen-button-grid` | `*` marks `aria-pressed="true"` |
| Pin button | existing button colors | proposed `.mdopen-pin-button` | absolute top-right overlay; does not reserve a row |
