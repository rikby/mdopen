# Mermaid Fullscreen

Fullscreen viewing mode for Mermaid diagrams rendered by mdopen.

## Composition

```text
MermaidContainer
├── FullscreenButton
└── MermaidDiagram
    └── RenderedSvg
```

## Source files

| Type | Path |
|------|------|
| Renderer and interaction script | `renderer.js` |
| CSS | `assets/mdopen.css` |
| Styling guide | `docs/styling.md` |

## Layout

- Inline state keeps the diagram in normal Markdown flow.
- Fullscreen state uses `.mermaid-container:fullscreen`.
- Fullscreen container fills `100vw` by `100vh`.
- Diagram starts centered and fit within about 90% of viewport.
- Fullscreen overflow is hidden; movement happens through diagram transform, not scrollbars.
- Fullscreen button remains available and does not participate in drag gestures.

## States

| State | Trigger | Visual change | Behavior |
|-------|---------|---------------|----------|
| inline | page load | diagram inside Markdown content | native page scroll works |
| entering fullscreen | `FullscreenButton` click | browser begins fullscreen transition | pan/zoom handlers are installed immediately in the same click task |
| fullscreen ready | `fullscreenchange` | container fills viewport, diagram refits | drag and wheel remain active; fit scale is recalculated |
| panning | mouse down + drag | cursor changes to `grabbing` | diagram follows pointer in screen pixels |
| zooming | wheel / trackpad scroll | diagram scale changes | scroll up zooms in, scroll down zooms out |
| reset | double click | diagram returns to fit scale | translation resets to `{ x: 0, y: 0 }` |
| exiting | button click or Escape | inline layout returns | handlers and inline transform styles are removed |

## Interaction Contract

| Action | Required behavior |
|--------|-------------------|
| Click `Full` | Enter fullscreen and enable pan/zoom immediately, before waiting for `fullscreenchange` |
| Drag diagram | Move diagram in the same direction as pointer movement |
| Drag empty fullscreen space | Move diagram in the same direction as pointer movement |
| Wheel up | Zoom in |
| Wheel down | Zoom out |
| Double click | Reset to centered fit |
| Escape | Exit fullscreen and clean up pan/zoom state |
| Theme change | Re-render Mermaid and remove stale handlers before rendering again |

## Timing Requirements

| Requirement | Target |
|-------------|--------|
| Pan/zoom handler install | Same JavaScript click task as the `Full` button click |
| First drag responsiveness | No user-visible wait after fullscreen visual appears |
| First wheel responsiveness | No user-visible wait after fullscreen visual appears |
| `fullscreenchange` role | Refits diagram and cleanup only; must not be the first point where handlers are installed |

## Tokens used

| Element | Token / value | Usage |
|---------|---------------|-------|
| Inline container border | `--mdopen-preview-border` | Mermaid card border |
| Fullscreen background | existing `.mermaid-container` background | reading surface |
| Button chrome | current rgba button colors | fullscreen toggle |

## Classes used

| Element | Class | Source |
|---------|-------|--------|
| container | `.mermaid-container` | `renderer.js`, `assets/mdopen.css` |
| diagram | `.mermaid` | Mermaid render target |
| button | `.mermaid-fullscreen-btn` | `renderer.js`, `assets/mdopen.css` |

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| MF-1 | Clicking `Full` enters fullscreen. |
| MF-2 | Drag works immediately after fullscreen opens; no 3-5 second dead period. |
| MF-3 | Wheel zoom works immediately after fullscreen opens; no 3-5 second dead period. |
| MF-4 | Drag moves the diagram by visible screen-pixel movement. |
| MF-5 | Wheel up increases rendered diagram size. |
| MF-6 | Wheel down decreases rendered diagram size. |
| MF-7 | Exiting fullscreen removes handlers and restores inline state. |

## Extension notes

- Do not add runtime dependencies for pan/zoom.
- Keep the `.mermaid-container` / `.mermaid` structure required by `AGENTS.md`.
- If browser fullscreen timing differs by platform, mdopen must still install handlers before calling `requestFullscreen()`.
