# Architecture Decision Record 1: Use react-markdown with remark-gfm for Rendering Markdown Content

Date: 05/03/2026

# Context

The base model detail page displays long-form content (overview, use cases, performance, limitations) that was previously rendered using manual paragraph splitting and hardcoded HTML structures. As content grows in complexity — with bold text, inline code, lists, headings, and links — maintaining this as plain strings with custom rendering logic becomes difficult and error-prone.

We need a solution to render rich, structured text from markdown strings so that content authors can express formatting naturally, while the UI consistently applies the project's design system.

## Decision Drivers

- Content flexibility: authors should be able to use headings, bold, lists, code, and links without code changes.
- Consistency: rendered markdown must match the application's existing design system (colors, typography, spacing).
- Minimal bundle impact: the chosen library should be lightweight and avoid unnecessary overhead.
- Existing ecosystem: leverage libraries already present in the project wherever possible.
- Security: HTML should be sanitised by default to prevent XSS from user-supplied content.

## Considered Options

- **[react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)** — A lightweight React component that converts markdown to React elements via the unified/remark ecosystem. `remark-gfm` adds GitHub Flavored Markdown support (tables, strikethrough, task lists, autolinks). Does **not** use `dangerouslySetInnerHTML`; it builds a React virtual DOM tree. Already installed as project dependencies.
- **[markdown-to-jsx](https://www.npmjs.com/package/markdown-to-jsx)** — A single-package alternative that compiles markdown to JSX. Slightly smaller bundle size, but lacks the plugin ecosystem of remark and does not support GFM features without extra work.

- **Custom rendering logic** — Continue splitting strings on `\n\n` and mapping to `<p>`, `<ul>`, `<ol>` elements manually. Does not scale as content grows in richness.

# Decision

We will use **react-markdown** (v9) with the **remark-gfm** plugin to render all long-form content in the frontend starting with base model detail page.

Key implementation details:

1. **Data model simplification**: The separate `overview`, `useCases`, `performance`, and `limitations` fields on `TBaseModelDetail` are consolidated into a single `markdownContent: string` field containing full markdown.
2. **Styling**: The Tailwind CSS `@tailwindcss/typography` plugin's `prose` class is used as the base, with a scoped `.model-detail-prose` CSS class that overrides defaults to match the application's design tokens (colors, font sizes, spacing).
3. **Banner isolation**: The existing banner component's `.prose *` white-text override is scoped to `.prose:not(.model-detail-prose)` so the two contexts do not conflict.

# Status

Accepted.

# Consequences

- **Positive**: Content is now authored in standard markdown, making it easier to update and maintain. Markdown supports headings, bold, italic, lists, inline code, links, and tables out of the box.
- **Positive**: No new dependencies added — `react-markdown`, `remark-gfm`, and `@tailwindcss/typography` were already in `package.json`.
- **Positive**: Safe by default — `react-markdown` does not use `dangerouslySetInnerHTML` and builds React elements directly.
- **Trade-off**: Content structure is now implicit in the markdown string rather than explicit in the TypeScript type. If specific sections need to be programmatically accessed separately (e.g., extracting just the overview), parsing the markdown would be required.
- **Trade-off**: Custom `.model-detail-prose` CSS styles need to be maintained alongside the design system. If design tokens change, these styles must be updated accordingly.
