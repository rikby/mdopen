# Toolbar Menu — Wireframe Schema

Related spec: `docs/design/specs/toolbar-menu.md`

## Default Closed State

```wireframe
Desktop, closed

                                    ┌────────────────┐
                                    │ [Dark] [☰]     │
                                    └────────────────┘

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

                                    ┌────────────────┐
                                    │ [Dark] [☰]     │
                                    └───────┬────────┘
                                            │
                              ┌─────────────┴─────────────┐
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
                              │ Auto-hide          [On*] │
                              └───────────────────────────┘
```

## Mobile Variant

```wireframe viewport:mobile
Mobile, closed

┌──────────────────────────────────────────┐
│              [Dark] [☰]                 │
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
│              [Dark] [☰]                 │
├──────────────────────────────────────────┤
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
│ Auto-hide                         [On*] │
└──────────────────────────────────────────┘
```

## Annotations

| Element | Token / color | Class / pattern | Notes |
|---------|---------------|-----------------|-------|
| Toolbar | `--bgColor-default`, current translucent mix | `.mdopen-toolbar` | fixed, compact, two visible controls |
| Theme toggle | `--fgColor-default` | existing `#mdopen-theme-toggle` | stays outside menu |
| Menu button | `--fgColor-default` | proposed `.mdopen-menu-button` | `aria-expanded` reflects open state |
| Menu panel | `--bgColor-default`, existing border mix | proposed `.mdopen-menu-panel` | hidden when closed, fixed-position popover |
| Option groups | `--fgColor-muted` labels | proposed `.mdopen-option-group` | fieldset/legend structure |
| Option buttons | existing button colors | proposed `.mdopen-segmented`, `.mdopen-button-grid` | `*` marks `aria-pressed="true"` |
| Auto-hide | existing button colors | proposed `.mdopen-menu-preferences` | controls outside-click close behavior |
