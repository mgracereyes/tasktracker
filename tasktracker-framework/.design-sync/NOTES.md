# design-sync notes: task tracker dashboards

Project: https://claude.ai/design/p/86aa30ad-af33-4fd5-bead-fb6183ee33a4 (first synced 2026-11-13)

## How this repo is built for the sync

- This is an **app, not a component library**: there is no library `dist/` and no `.d.ts` output. The build uses a hand-written entry, `.design-sync/entry.ts`, that re-exports only the shared components from `src/components/` (ui.tsx, HoverSelect, DateRange, Icons).
- Build command (from the repo root):
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.design-sync/entry.ts --out ./ds-bundle`
  The same `--entry` must be passed to `resync.mjs`.
- **Layout is excluded** (`componentSrcMap.Layout: null`, and it isn't in entry.ts). It calls `useMe()`/`useAuth()` and `useRouter()`, so it throws outside AuthProvider + Router, and importing it pulls in `src/api/*` and all the sample data. The shell look is documented as classes in conventions.md instead.
- **`Icon` is excluded** from the component list (it's an object of JSX elements, not a component); it still ships in the bundle as `window.TaskTrackerDS.Icon`.
- **Prop types are hand-written** in `cfg.dtsPropsFor` (no `.d.ts` tree exists). When a component's props change in `src/components/*.tsx`, update `dtsPropsFor` to match, because nothing does it automatically.
- **Font**: the app loads Public Sans from Google Fonts in `index.html`, which the converter can't see. `extraFonts` points at `@fontsource/public-sans` latin 400–700 CSS inside `.ds-sync/node_modules`; that package must be installed there after staging the scripts: `(cd .ds-sync && npm i esbuild ts-morph @types/react playwright @fontsource/public-sans)`.
- Playwright + Chromium are installed in `.ds-sync/` (Chromium cache in `%LOCALAPPDATA%\ms-playwright`). Run validate/capture with `NODE_PATH=./.ds-sync/node_modules`.
- **Windows file lock**: stop the `.review.html` server (`http-serve.mjs`) before any full build or `resync.mjs` run, and make sure no shell has `ds-bundle/` as its working directory (a `cd ds-bundle` in an earlier command is enough). Either one makes the build fail with `EPERM ... ds-bundle` (seen 2026-11-13).

## Preview gotchas

- **Modal**: `.ovl` is `position: fixed`, so the preview wraps each story in a frame with `transform: translateZ(0)` (makes it the containing block), and `cfg.overrides.Modal` uses `cardMode: single`. Without the frame the dialog escapes the card and gets clipped.
- **HoverSelect** opens on CSS `:hover`/`:focus-within`; the `OpenWithGroups` story forces `.flist { display: block }` with a scoped `<style>` to show the open list.
- Card, ChoiceTiles, Empty, ErrorBox, Field, Loading, PageHead and Progress use `cardMode: column` (they flagged `[GRID_OVERFLOW]` in the grid layout).

## Known render warns

- None outstanding after the column overrides.

## Re-sync risks

- `dtsPropsFor` is a hand copy of the component signatures, so it goes stale silently when props change. Diff it against `src/components/*.tsx` on every re-sync.
- `conventions.md` lists class names and tokens from `src/styles/global.css`. Renaming or removing a class there makes the guide wrong, so re-run the name check against `ds-bundle/_ds_bundle.css`.
- The bundle depends on `@fontsource/public-sans` (unpinned) and `playwright` (unpinned) installed into `.ds-sync/`. A new major version could change the font file names or the Chromium build.
- New shared components added to `src/components/` won't sync until they're added to `entry.ts` **and** `componentSrcMap`.
