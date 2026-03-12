# Art Deco SaaS Marketplace Design System

## 1. Design Recommendations
- Use Art Deco as a structural accent (frames, separators, focus rings), not as heavy ornamentation.
- Prioritize information hierarchy, clear CTAs, and predictable interaction patterns.
- Keep strict spacing rhythm (8px baseline) and alignment to increase perceived trust.

## 2. Improved Layout Structure
- Hero: value proposition, search, trust badges.
- Discovery: category cards grouped by actor type.
- Search workspace: filter sidebar + results + map panel.
- Profile area: proof-first cards (verification, SLA, volume, ratings).
- Feature area: business capabilities (matching, billing, messaging, compliance).

## 3. Color Palette (CSS Variables)
- `--ui-color-bg: #F4F6F8`
- `--ui-color-surface: #FFFFFF`
- `--ui-color-surface-soft: #EBEFF2`
- `--ui-color-border: #D5DBDF`
- `--ui-color-text: #2C3E50`
- `--ui-color-text-muted: #5D6D7E`
- `--ui-color-primary: #D4AF37`
- `--ui-color-primary-strong: #B5A642`
- `--ui-color-accent: #1A2530`

## 4. Typography Pairing
- Display headings: `Cormorant Garamond` via `--font-primary`.
- Body/UI text: `Open Sans` and `Montserrat` for labels and actions.
- Heading treatment: uppercase + subtle tracking (`0.04em`) on section titles.

## 5. UI Component Style Suggestions
- Cards: thin neutral border + inner gold frame.
- Buttons: geometric corners (`3-4px`), dark/gold contrast, crisp focus ring.
- Inputs/selects: strong text contrast, gold focus outline, clean spacing.
- Separators: thin horizontal line with central diamond motif.

## 6. Animation and Micro-interactions
- Hover lift: `translateY(-2px)`.
- Duration: `180-260ms`.
- Easing: soft transitions to avoid abrupt motion.
- Maintain visible keyboard focus states on all controls.

## 7. Textures and Visual Motifs
- Use low-opacity geometric backgrounds in hero/footer.
- Keep pattern opacity under 10% to preserve readability.
- Favor line-based motifs (diamond, nested rectangles, stepped frames).

## 8. Trust and Professionalism
- Surface verification badges and service-level indicators above fold.
- Standardize profile card structure with measurable proof points.
- Keep photography consistent in tone and quality across actor profiles.

## Implementation Notes
- Theme available via `.theme-art-deco` or `[data-theme="art-deco"]`.
- New showcase route: `/design-system`.
- Core primitives now support tokenized geometry:
  - `--ui-button-radius`
  - `--ui-input-radius`
  - `--ui-select-radius`
  - `--ui-card-radius`
