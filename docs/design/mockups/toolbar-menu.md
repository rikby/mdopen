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
                              │ Theme  [Default       ▾]  │
                              │ Font   [Source        ▾]  │
                              │ Tone   [Default       ▾]  │
                              │ Color  [Default       ▾]  │
                              │ Gap    [Normal        ▾]  │
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
│ [Default                              ▾] │
│ Font                                     │
│ [Source                               ▾] │
│ Tone                                     │
│ [Default                              ▾] │
│ Color                                    │
│ [Default                              ▾] │
│ Gap                                      │
│ [Normal                               ▾] │
└──────────────────────────────────────────┘
```

## Annotations

| Element | Token / color | Class / pattern | Notes |
|---------|---------------|-----------------|-------|
| Toolbar | `--bgColor-default`, current translucent mix | `.mdopen-toolbar` | fixed, compact, two visible controls |
| Theme toggle | `--fgColor-default` | existing `#mdopen-theme-toggle` | stays outside menu |
| Menu button | `--fgColor-default` | proposed `.mdopen-menu-button` | `aria-expanded` reflects open state |
| Menu panel | `--bgColor-default`, existing border mix | proposed `.mdopen-menu-panel` | hidden when closed, fixed-position popover |
| Select rows | existing select styles | current `label > select` pattern | same controls, new container |
