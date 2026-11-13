# Task Tracker conventions (read first)

**No provider or wrapper is needed.** Load `styles.css` + `_ds_bundle.js` and use `window.TaskTrackerDS.*`. Light/dark mode is automatic (`prefers-color-scheme`); never hard-code colours.

## Styling idiom: global utility classes + CSS variables

Components are thin; most layout comes from **global class names** defined in `styles.css` (`_ds_bundle.css`). Use these classes for your own layout glue instead of inventing new ones; use inline `style` only for one-off widths.

| Purpose | Classes |
|---|---|
| Flex layout | `row` (horizontal, centred, gap), `col` (vertical), `gap`, `wrap`, `between`, `end`, `grow`, `self-end` |
| Grids | `grid2`, `grid3`, `tiles` (auto-fit KPI tiles) |
| Text | `mut` (muted), `small`, `ell` (ellipsis), `err` (error red), `late`, `warnbox` (amber callout) |
| Buttons | `btn` (primary), `btn ghost` (secondary), `btn danger`, `btn sm`, `btn wide`, `link` (text button), `iconbtn` |
| KPI tile | `tile` > `span` (label) + `b` (big value) + `small` (caption); add `warn` for a warning tile |
| Tables | `tbl` (add `scroll`), rows `tr` + column preset `c3` / `c5` / `c6` / `c7`; header row `tr th`; muted row `tr off` |
| Bars list | `bars` > `barrow` > `span` label + `<Progress>` + `b` value |
| Filters | `fbar` (filter grid; `c5`, `c6` presets) holding `HoverSelect`s |
| Chips | `chip`, `chip on` |
| Form layout | `dates` (two date `Field`s side by side), `lvsum` (gray summary panel: `span` left + `span` with big `b` right), `leavegrid` (2/5 form + 3/5 list, stacks under 1100px) |
| Leave page | header `balpills` > `balpill` (`<b>VL</b> 8 days left`; SL shows "days used"); `lvform` (one row: type / duration / from / until / remarks `Field`s + `btn`); stacked `Card`s "Upcoming leave" and "Past leave" + `hsub` "(last 90 days)", each a `tbl` of `tr lvt` rows: Date (`2026-10-09 Fri`) / `<b>VL</b> Vacation Leave` / Duration / `num` credited / remarks (`—` if none) / `lvact` ("Cancel leave" `link`, or `mut` "Locked"); header `tr th lvt`. Types: VL, SL, EL |
| App shell | `shell` > `header.top` (`brand`), `nav.side` (`a.nav`, `nav on` = current, `span.lbl`), `main.main` |

Native `<input>`, `<select>`, `<textarea>` are styled globally; wrap each in `<Field label="…">`.

**Tokens** (use as `var(--name)`): `--bg`, `--card`, `--text`, `--muted`, `--faint`, `--line`, `--border`, `--primary`, `--primary-soft`, `--ring`, `--ok`, `--ok-soft`, `--warn`, `--warn-soft`, `--bad`, `--bad-soft`, `--meeting`, `--radius`. Font: Public Sans (shipped).

## Components

`PageHead` (page title + actions), `Card` (every content block), `Tabs`, `HoverSelect` (dropdown/filter, opens on hover/focus), `DateRange` (start/end + Apply, max 92 days), `Field`, `ChoiceTiles` (labelled radio group as selectable tiles; use instead of plain radios for 2–4 choices), `Pill` (status: `grey`/`ok`/`warn`/`bad`/`blue`), `Progress` (`task` blue / `meeting` orange; `leave` adds a gray VL/SL segment; hours are minutes, 8h = 480), `Modal` (needs `onClose`; buttons go in `footer`), `Empty`, `ErrorBox`, `Loading`, `AwsLogo`. Per-component docs: `components/general/<Name>/<Name>.prompt.md`. The real stylesheet to read: `styles.css` → `_ds_bundle.css`.

## Example: a dashboard page

```jsx
const { PageHead, Card, Pill, Progress, DateRange } = window.TaskTrackerDS;

<div className="col gap">
  <PageHead title="Dashboard" sub="Welcome back, Aisha." actions={<button className="btn ghost">Export CSV</button>} />
  <div className="tiles">
    <div className="tile"><span>Logged so far</span><b>32h</b><small>of 40h expected</small></div>
    <div className="tile warn"><span>Days under 8h</span><b>2</b><small>Mon 19 Oct, Tue 20 Oct</small></div>
  </div>
  <Card title="Hours by project" actions={<DateRange from="2026-10-19" to="2026-10-23" onApply={() => {}} />}>
    <div className="bars">
      <div className="barrow"><span>Alpha / Build</span><Progress value={1200} max={1500} /><b>20h</b></div>
      <div className="barrow"><span>Stand-ups</span><Progress value={300} max={1500} kind="meeting" /><b>5h</b></div>
    </div>
  </Card>
  <Card title="Unlock requests">
    <div className="tbl">
      <div className="tr c3"><b>Ben Ortiz</b><span className="mut">Tue 29 Sep · Edit time</span><Pill tone="warn">Pending</Pill></div>
    </div>
  </Card>
</div>
```
