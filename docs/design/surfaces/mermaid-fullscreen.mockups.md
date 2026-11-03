# Mermaid Fullscreen — Wireframe Schema

Related spec: mermaid-fullscreen.spec.md

## Inline State

```wireframe
┌──────────────────────────────────────────────┐
│ Markdown document                            │
│                                              │
│ ## Mermaid diagrams                          │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │                                  [Full]  │ │
│ │                                          │ │
│ │              ┌──────────┐                │ │
│ │              │ Start    │                │ │
│ │              └────┬─────┘                │ │
│ │                   │                      │ │
│ │              ┌────▼─────┐                │ │
│ │              │ Finish   │                │ │
│ │              └──────────┘                │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Entering Fullscreen

```wireframe state:mermaid-fullscreen entering
click [Full]

┌──────────────────────────────────────────────┐
│ Same click task                              │
│                                              │
│ 1. copy image/SVG into shared dialog             │
│ 2. showModal() and apply centered fit               │
│ 3. wheel + pointer handlers are ready                  │
│                                              │
│ No Fullscreen API transition before       │
│ interaction becomes active.                  │
└──────────────────────────────────────────────┘
```

The original translucent icon buttons float over the full canvas. Tap `?`
to show or hide zoom, Fit, and gesture help; no space is reserved for a header.

## Fullscreen Ready

```wireframe state:mermaid-fullscreen ready
┌────────────────────────────────────────────────────────────┐
│ Media canvas                               [Exit] [?]  │
│                                                            │
│                                                            │
│                  ┌────────────────────┐                    │
│                  │ Start              │                    │
│                  └─────────┬──────────┘                    │
│                            │                               │
│                  ┌─────────▼──────────┐                    │
│                  │ Finish             │                    │
│                  └────────────────────┘                    │
│                                                            │
│ wheel zooms immediately; drag pans immediately             │
└────────────────────────────────────────────────────────────┘
```

## Panning State

```wireframe state:mermaid-fullscreen panning
┌────────────────────────────────────────────────────────────┐
│ Media canvas                               [Exit] [?]  │
│                                                            │
│  cursor: grabbing                                          │
│                                                            │
│                            ┌────────────────────┐          │
│                            │ Start              │          │
│                            └─────────┬──────────┘          │
│                                      │                     │
│                            ┌─────────▼──────────┐          │
│                            │ Finish             │          │
│                            └────────────────────┘          │
│                                                            │
│ drag right/down moves diagram right/down                   │
└────────────────────────────────────────────────────────────┘
```

## Zoom State

```wireframe state:mermaid-fullscreen zoom
┌────────────────────────────────────────────────────────────┐
│ Media canvas                               [Exit] [?]  │
│                                                            │
│       ┌────────────────────────────────────────────┐       │
│       │ Start                                      │       │
│       └─────────────────────┬──────────────────────┘       │
│                             │                              │
│       ┌─────────────────────▼──────────────────────┐       │
│       │ Finish                                     │       │
│       └────────────────────────────────────────────┘       │
│                                                            │
│ wheel up = larger, wheel down = smaller                    │
└────────────────────────────────────────────────────────────┘
```

## Annotations

| Element | Token / color | Class / pattern | Notes |
|---------|---------------|-----------------|-------|
| Container | `--mdopen-preview-border` | `.mermaid-container` | inline card, remains in document flow |
| Diagram | browser transform | `.mdopen-media-content` | isolated copy, pan/zoom target |
| Button | theme surface | `.mdopen-media-fullscreen-btn` | opens modal dialog |
| Fullscreen viewport | theme surface | `.mdopen-media-viewport` | overflow clipped |
| Timing | n/a | `showModal()` in click handler | immediate pan/zoom |
