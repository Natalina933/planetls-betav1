# Dashboard Figma Handoff

## Frames

- Desktop: 1440 x 1024
- Tablet: 768 x 1024
- Mobile: 375 x 812

Use a 12-column grid, 8 px gutters, and 24 px margins. Keep the same component names as the code: `CardKPI`, `MissionCard`, `ButtonPrimary`, `Badge`, `BottomNav`, `NextStepsPopup`.

## Variables

- Colors: `gold`, `ivory`, `text`, `muted`, `border`, `danger`, `success`, `info`
- Type: serif titles, sans-serif body
- Spacing: 8, 16, 24, 32 px
- Radius: 8 px for compact cards and controls, 16 px for dashboard cards, 20 px for bottom navigation

## Dashboard Structure

1. Header: identity, Essential/Expert switch where relevant, notification badge, profile access.
2. Hero: 3 KPI cards with icon, label, big number, short hint, and delta badge.
3. Middle: mission rail with status badge and clear CTA, followed by quick actions.
4. Footer: tab navigation for Accueil, Biens or Missions, Messages, Profil.

## Responsive Rules

- Mobile: KPI cards stack, mission cards become horizontal rail, bottom navigation is fixed.
- Tablet: KPI cards use 2 columns where there are 4 stats, 3 columns where there are 3 stats.
- Desktop: KPI cards fit in one row, mission rail becomes a static 3-column grid.

## States

- Hover: slight border contrast and elevation.
- Focus: visible outline on links, buttons, inputs, selects.
- Loading: skeleton blocks matching final card sizes.
- Empty: one concise sentence and a single primary action.
