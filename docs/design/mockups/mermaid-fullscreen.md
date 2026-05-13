# Mermaid Fullscreen — Wireframe Schema

Related spec: `docs/design/specs/mermaid-fullscreen.md`

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
│ 1. install wheel + drag handlers             │
│ 2. apply initial fit transform               │
│ 3. call requestFullscreen()                  │
│                                              │
│ No waiting for fullscreenchange before       │
│ interaction becomes active.                  │
└──────────────────────────────────────────────┘
```

## Fullscreen Ready

```wireframe state:mermaid-fullscreen ready
┌────────────────────────────────────────────────────────────┐
│ MermaidContainer :fullscreen                       [Full]  │
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
│ MermaidContainer :fullscreen                       [Full]  │
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
│ MermaidContainer :fullscreen                       [Full]  │
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
| Container | `--mdopen-preview-border` | `.mermaid-container` | inline card, fullscreen root |
| Diagram | browser transform | `.mermaid` | transform target for pan/zoom |
| Button | current rgba button styling | `.mermaid-fullscreen-btn` | ignored by drag handlers |
| Fullscreen viewport | existing background | `.mermaid-container:fullscreen` | overflow hidden |
| Timing | n/a | click handler before `requestFullscreen()` | avoids visible dead period |
