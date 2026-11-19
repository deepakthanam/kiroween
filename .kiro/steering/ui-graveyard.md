---
inclusion: fileMatch
fileMatchPattern: "apps/web/**"
---
# Graveyard UI direction

The UI is a graveyard at night. It should feel quiet and a little unsettling, and it must stay a usable developer tool.

## Tokens (define as CSS custom properties in `apps/web/src/styles/tokens.css`)
- Background `--night: #0b0f14`; raised surface `--slate: #151c24`; stone `--stone: #8a94a3`.
- Text `--bone: #e6e1d6`; muted `--fog: #9aa3ad`.
- Accent for life `--ectoplasm: #7dffb2`; warning `--ember: #ffb454`; refusal `--blood: #ff5d6c`.
- Type: one serif display face for headings and epitaphs, one monospace for package names, versions and data. Load at most two font families.
- Spacing scale 4, 8, 12, 16, 24, 32, 48. Radius 2px on stone, 8px on panels.

## Components
- **Tombstone**: package name, version, last publish year as the "died" date, dead score, one-line cause. State drives the look: dormant, exhuming, reanimating, proving, risen, refused.
- **Stage timeline**: three stages with live status from the event stream.
- **Proof-of-life counter**: cases run, mismatches, control status, catch rate. Numbers in monospace, tabular figures.
- **Counterexample panel**: shrunk input, original outcome, revived outcome, seed, copy button.

## Motion
- The rise animation is the one big moment: under 1.2 s, transform and opacity only.
- Fog and flicker are subtle and decorative. Respect `prefers-reduced-motion`: replace all motion with instant state changes.

## Accessibility
- WCAG AA contrast for all text. State is never conveyed by colour alone; pair it with a label or icon.
- Full keyboard path: upload, tombstone grid (arrow keys), detail, back. Visible focus ring.
- Live regions announce stage changes and verdicts.

## Copy
- Verdict words are exactly `REVIVED`, `PARTIAL`, `REFUSED`. Say "evidence over N cases", never "proof".
- Plain developer language in controls and errors. Keep the spooky voice to headings and empty states.

## Do not
- Use third-party logos or brand marks anywhere (the demo video rules forbid them).
- Add a component library or CSS framework.
- Block the main thread with decorative effects.
