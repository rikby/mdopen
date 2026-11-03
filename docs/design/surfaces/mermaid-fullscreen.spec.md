# Image and Mermaid fullscreen zoom

Images and Mermaid diagrams use the shared viewer described in
[media zoom](../../media-zoom.md). Runtime ownership is in
[ARCHITECTURE.md](../../../ARCHITECTURE.md).

## Structure and ownership

- Mermaid retains `.mermaid-container > .mermaid > svg`.
- Images retain their source/alt/link, inside `.mdopen-image-container`.
- `templates/media-overlay.html` adds Full buttons and owns the modal dialog and gestures.
- `templates/mermaid-script.html`, the directory viewer, and the editor only render diagrams.
- `assets/mdopen.css` owns the shared, theme-aware styles and print exclusions.

## Acceptance criteria

| ID | Criterion |
| --- | --- |
| MF-1 | Full opens a modal zoom viewer, fitted and centered, without the Fullscreen API. |
| MF-2 | Drag works immediately, including on empty viewer space. |
| MF-3 | Wheel zoom works immediately. |
| MF-4 | Drag moves the media by the pointer's screen-pixel movement. |
| MF-5 | Wheel up, + button, keyboard +, and pinch out increase scale. |
| MF-6 | Wheel down, − button, keyboard −, and pinch in decrease scale. |
| MF-7 | Close/Escape restores scrolling and focus; the original media stays unchanged. |
| MF-8 | Dark mode uses the shared dark surface; print output remains light. |
| MZ-1 | Images work without loading Mermaid and retain source-relative URLs. |
| MZ-2 | Linked images navigate normally; their Full button opens zoom separately. |
| MZ-3 | Fit, double-click, keyboard 0, and resize reset to centered fit. |
| MZ-4 | Document replacement, theme changes, and printing close stale overlays. |
| MZ-5 | All rendering paths use the same overlay and gesture implementation. |

The repeatable browser probe is `test/browser/media-zoom.js`.
