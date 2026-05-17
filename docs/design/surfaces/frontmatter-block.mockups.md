# Frontmatter Block — Wireframe Schema

Related spec: frontmatter-block.spec.md

## Collapsed State

```wireframe
Markdown document with frontmatter

┌──────────────────────────────────────────────┐
│ ▸ Frontmatter                                │
│                                              │
│ # Document title                             │
│ Body content starts after the metadata block.│
└──────────────────────────────────────────────┘
```

## Expanded State

```wireframe state:frontmatter expanded
Markdown document with frontmatter

┌──────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────┐ │
│ │ ▾ Frontmatter                           │ │
│ │ title: Release Notes                    │ │
│ │ tags:                                   │ │
│ │   - docs                                │ │
│ │   - print                               │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ # Document title                             │
│ Body content starts after the metadata block.│
└──────────────────────────────────────────────┘
```

## Print Default

```wireframe state:frontmatter print-default
Printed page

┌──────────────────────────────────────────────┐
│ # Document title                             │
│ Body content prints without frontmatter.     │
└──────────────────────────────────────────────┘
```

## Print Enabled

```wireframe state:frontmatter print-enabled
Printed page after menu flag is enabled

┌──────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────┐ │
│ │ title: Release Notes                     │ │
│ │ tags:                                    │ │
│ │   - docs                                 │ │
│ │   - print                                │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ # Document title                             │
│ Body content prints after metadata.          │
└──────────────────────────────────────────────┘
```

## Menu Control

```wireframe state:toolbar-menu open-with-frontmatter
Desktop, menu open

                                    ┌──────────────────────────┐
                                    │ [☀] [⧉] [🖨] [☰]        │
                                    └───────────────┬──────────┘
                                                    │
                              ┌─────────────┴─────────────┐
                              │ Copy                 [📍] │
                              │ [Rich] [Plain] [Docs]    │
                              │ Other                    │
                              │ [Print frontmatter]      │
                              │ [Wrap code*]             │
                              │ Theme                    │
                              │ [Default*] [Demo] [RTD]  │
                              │ Font                     │
                              │ [Source*] [System] [...] │
                              │ Tone / Color / Gap       │
                              │ [...]                    │
                              └───────────────────────────┘
```

## Mobile Variant

```wireframe viewport:mobile
Mobile, collapsed

┌──────────────────────────────────────────┐
│ ▸ Frontmatter                            │
│                                          │
│ # Document title                         │
│ Body keeps current mobile padding.       │
└──────────────────────────────────────────┘
```

## Annotations

| Element | Token / color | Class / pattern | Notes |
|---------|---------------|-----------------|-------|
| Frontmatter root | active code-block surface | `.mdopen-frontmatter` | native collapsed disclosure above body; single visual block |
| Summary | `--fgColor-muted` fallback | `.mdopen-frontmatter summary` | visible label only; no explanatory copy |
| Metadata content | transparent inner pre/code | `.mdopen-frontmatter pre > code` | raw escaped source text; no nested panel |
| Print flag | existing option button styling | `data-mdopen-control="print-frontmatter"` proposed | persistent boolean option in Other menu group |
| Print visibility | print tokens | `html[data-mdopen-print-frontmatter="true"]` | default hidden in print |
