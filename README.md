# AWS Task Tracker – Frontend
 
Web app for the AWS Task Tracker timesheet system. Employees log their time, team leads manage their team and projects, and managers and admins monitor effort, lock periods and export reports. The menu changes by role.
 
## Tech Stack
 
- React with TypeScript (Vite)
- Google sign-in
- Vitest for unit tests, Playwright for end-to-end tests
## Project Structure
 
```
aws-task-tracker-frontend/
├── public/                  Logo and static files
├── src/
│   ├── main.tsx             App start-up
│   ├── App.tsx              Routes and role-based menu
│   ├── api/                 Calls to the backend
│   ├── auth/                Google sign-in and session
│   ├── components/          Shared parts (sidebar, header, dropdowns, modals, date fields, charts)
│   ├── pages/
│   │   ├── Login/           Sign-in screen
│   │   ├── Dashboard/       Employee, Team Lead and Manager dashboards
│   │   ├── Activity/        Timer, timeline, Admin My time and Correct an entry
│   │   ├── Leave/           File VL and SL
│   │   ├── Setup/           Projects, templates, Save as template
│   │   ├── Assignments/     Assignments and People & projects
│   │   ├── Locks/           Locks and unlock requests
│   │   ├── Reports/         Reports and export
│   │   └── Admin/           Users, roles, audit log
│   ├── hooks/               Shared React hooks
│   ├── styles/              Colours, fonts, light and dark mode
│   └── utils/               Date and hour formatting
├── tests/                   Vitest unit tests
├── e2e/                     Playwright tests
├── .env.example             Settings template
├── package.json
└── README.md
```
 
## Setup
 
1. Clone and install:
```
   git clone <repo-url> aws-task-tracker-frontend
   cd aws-task-tracker-frontend
   npm install
```
2. Copy `.env.example` to `.env` and fill in:
```
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=
```
3. Start the app (the backend must be running):
```
   npm run dev
```
   App: http://localhost:5173
 
## Commands
 
| Command | What it does |
|---|---|
| `npm run dev` | Start the app for development |
| `npm run build` | Build for release |
| `npm test` | Run unit tests |
| `npx playwright test` | Run end-to-end tests |
 
## Rules
 
- Never commit `.env`.
- Hiding a button is not security; the backend checks every permission.
- Follow the UI mockups for layout and wording.
- Link each pull request to its FR ID and test case (TC-xxx).
 
