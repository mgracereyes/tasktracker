# AWS Task Tracker – Frontend

Web app for the AWS Task Tracker timesheet system (Requirements v1.2, FR-001 to FR-035). Employees log their time, team leads manage their team and projects, and managers and admins monitor effort, lock periods and export reports. The menu changes by role.

It runs on built-in sample data (21 Sep – 21 Oct 2026) until the backend is ready. The sample mode applies the same permission rules as the backend, so every screen can be tried now.

## Tech Stack

- React 18 with TypeScript, built with Vite
- No UI or routing libraries: a small router (`src/router.tsx`) and shared components
- Vitest for unit tests

## Project Structure

```
aws-task-tracker-frontend/
├── src/
│   ├── main.tsx             App start-up
│   ├── App.tsx              Routes; blocks pages a role cannot open
│   ├── nav.ts               Sidebar items by role (FR-028)
│   ├── config.ts            Today, app version, 8-hour target
│   ├── router.tsx           Small router (links, query string)
│   ├── hooks.ts             useLoad / useAction for API calls
│   ├── api/
│   │   ├── client.ts        The one API used by every page (mock or backend)
│   │   ├── http.ts          Backend calls (FastAPI, httpOnly session cookie)
│   │   ├── mock.ts          Sample-mode API with the same rules as the backend
│   │   ├── mockData.ts      Sample people, projects, entries, locks
│   │   └── types.ts         Shared types (Database Schema v1.3 names)
│   ├── auth/                Signed-in user (memory only, no localStorage)
│   ├── components/          Layout, hover dropdown, date range, modal, progress bar, icons
│   ├── pages/
│   │   ├── Login.tsx        Sign-in (Google SSO on hold; sample accounts)
│   │   ├── dashboard/       Employee tiled view, Team lead Team tab, Manager overview,
│   │   │                    drill-down and filter results modals
│   │   ├── Activity.tsx     Timer, timeline, edit, locked days, unlock request,
│   │   │                    Admin "Correct an entry"
│   │   ├── Leave.tsx        VL and SL, whole or half day
│   │   ├── Setup.tsx        Projects from templates, Public/Private, Save as template
│   │   ├── Assignments.tsx  Assignments; Manager "Assignments & Admin"
│   │   ├── Locks.tsx        Lock ranges, allow or decline unlock requests
│   │   ├── Reports.tsx      Filters and export (Manager and Admin)
│   │   └── Admin.tsx        People, business unit, roles, projects, audit log
│   ├── styles/global.css    Colours, light and dark mode
│   └── utils/               Dates, hour formatting, CSV
├── tests/                   Vitest tests (formatting, sidebar by role, permissions)
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

## Setup

1. Install:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env`. Keep `VITE_USE_MOCK=true` to use the sample data.
3. Start:
   ```
   npm run dev
   ```
   Open http://localhost:5173 and pick a sample account: Aisha Rahman (Employee), Dana Lopez (Team lead), Eli Park (Manager) or Fay Ong (Admin).

To use the backend, set `VITE_USE_MOCK=false` and `VITE_API_URL` to the API address.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app for development |
| `npm run build` | Type-check and build for release |
| `npm test` | Run unit tests |
| `npm run typecheck` | Type-check only |

## Notes

- Permissions shown in the menu are for convenience only. The backend checks every request.
- XLSX export is produced by the backend. In sample mode both export buttons save a CSV.
- Google sign-in is on hold (WBS T07). The email sign-in is for development only and must be removed before go-live.
