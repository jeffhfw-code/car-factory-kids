# Car Factory Kids

A free-to-host PWA where kids design cars, measure them in a lab, and race them
on ten tracks. Installable on iPad, iPhone, Android, and any modern browser.

> **Phase 1 status:** this is the deployable shell — routing, store, theme,
> manifest, and CI are in place. Game mechanics arrive in later phases.
>
> **Phase 2A status:** the normalized stat model is in. `RaceStats` now uses
> 0-10 ratings for every race-relevant value (plus `weightLbs`), with eight
> hidden stats wired in alongside the seven visible ones. A **seed catalog
> only** lives in `src/data/parts.ts`, `src/data/paints.ts`, and
> `src/data/sampleBuilds.ts` — three chassis, three engines, three wheel sets,
> three interiors, three tech parts, eight paint colors, three sample builds.
> `src/logic/statCalculator.ts` clamps stats, caps tech selections at 3, and
> returns a `ValidationResult` instead of throwing on bad input.
> `src/logic/labMeasurement.ts` converts ratings to lab numbers, with a
> seedable PRNG (`src/utils/random.ts`) so tests are deterministic.
> The factory/lab/race UI is intentionally deferred to a later phase.
>
> **Phase 2B status:** one playable test race exists. From **Home → Race →
> Start Test Race** you drop into a thin race slice that uses the
> **Speed Tester** sample build on a single **Oval Test Track** (`src/data/tracks.ts`).
> A pure, testable race engine (`src/race/engine/`) drives the loop:
> tap-and-hold GAS / BRAKE buttons (mouse, touch, and pointer events) feed a
> deterministic 2D physics step that derives top speed, acceleration, braking,
> coasting, curve safe-speed, and a sliding penalty from the Phase 2A stats.
> The race screen shows speed, progress, elapsed time, a sliding indicator,
> a finish message with the final time, and a Restart button. Full car
> selection, full track selection, AI opponents, Canvas rendering, audio,
> coins, and the unlock economy are deliberately deferred to later phases.

## Privacy notice

This app collects no data, contains no ads, has no purchases, and works fully
offline. All progress is stored only on this device.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/car-factory-kids/
```

## Build

```bash
npm run build      # type-check + Vite production build -> dist/
npm run preview    # serve dist/ locally to verify the build
```

## Tests

```bash
npm test           # Vitest, one run
npm run test:watch
```

## Deploying to GitHub Pages

The repo ships with `.github/workflows/deploy.yml`. Auto-deploys on every push
to `main`.

One-time GitHub setup:

1. Push the repo to GitHub.
2. Open **Settings -> Pages**.
3. Set **Source** to **GitHub Actions** (not "Deploy from a branch").
4. After the first successful workflow run, the app is live at
   `https://<username>.github.io/car-factory-kids/`.

The Vite `base` is hard-coded to `/car-factory-kids/`. If you rename the repo,
update `vite.config.ts` and the manifest's `start_url` / `scope` accordingly.

## Add to iPad / iPhone home screen

1. Open the GitHub Pages URL in **Safari** on the device.
2. Tap the **Share** button (square with up arrow).
3. Scroll down -> **Add to Home Screen**.
4. Name it "Car Factory" -> **Add**.

The icon appears on the home screen. Tapping it launches the app fullscreen,
landscape, with no browser chrome. Works offline after the first visit.

## Regenerating placeholder icons

`public/icons/` ships with plain colored squares. Replace them with real
artwork later. To rebuild the placeholders:

```bash
node scripts/generate-placeholder-icons.mjs
```

## Tech stack

- Vite 5 + React 18 + TypeScript
- `vite-plugin-pwa` for manifest & service worker
- `react-router-dom` v6
- `zustand` with `persist` middleware (localStorage)
- `framer-motion` for animations
- `@fontsource/nunito` (bundled, no CDN)
- `vitest` + `@testing-library/react` + `jsdom`
