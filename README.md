# To-Do List Life Dashboard

A clean, minimal, single-page productivity dashboard built with **HTML5, CSS3,
and vanilla JavaScript** — no frameworks, no build tools, no backend. All data
is saved in the browser with the Local Storage API.

## Features

### Core (MVP)
- **Greeting dashboard** — real-time clock (updated every second), current
  date, and a time-based greeting (Good Morning / Afternoon / Evening).
- **Focus timer** — Pomodoro timer (25 min default) with Start / Stop / Reset,
  `MM:SS` display, a progress ring, and a guard against overlapping intervals.
- **To-Do list** — add, edit, complete, and delete tasks, with a clear visual
  difference between completed and incomplete items. Tasks persist and reload
  after a refresh.
- **Quick links** — save a name + URL, open sites in a new tab safely
  (`rel="noopener noreferrer"`), and delete links. URLs are validated and
  normalized (a missing `https://` is added automatically).

### All five challenges
1. **Light / Dark mode** — theme toggle in the header and in Settings; every
   component adapts; the choice persists and restores on reopen.
2. **Custom name in greeting** — click the name in the greeting (or use the
   Settings field) to set/edit your name; it persists and restores.
3. **Custom Pomodoro length** — change the duration in Settings (1–120 min);
   it's validated, saved, and the timer resets to the new length.
4. **Prevent duplicate tasks** — duplicates are blocked (case-insensitive,
   trimmed) with a friendly toast notification, both when adding and editing.
5. **Sort tasks** — newest, oldest, completed-first, incomplete-first, or
   alphabetical. Sorting is applied to a copy at render time, so it never
   modifies your task data, and the chosen sort persists across refreshes.

## Project structure

```
project/
├── .kiro/                 # Kiro specification files (required for submission)
│   └── specs/life-dashboard/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── css/
│   └── style.css          # the only stylesheet
├── js/
│   └── script.js          # the only script
├── index.html
└── README.md
```

## Running locally

This is a static site — no server or install step is required.

- **Simplest:** double-click `index.html` to open it in your browser.
- **Recommended:** serve the folder over HTTP (avoids any browser restrictions
  on `file://` and matches the deployed environment):

  ```powershell
  # Python 3
  python -m http.server 8000
  # then visit http://localhost:8000
  ```

  ```powershell
  # Node.js (npx)
  npx serve
  ```

Tested in Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari.

## Deploying to GitHub Pages

1. Push this repository to GitHub (the `.kiro/` directory is committed so it
   is preserved in the repo).
2. In the repository on GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select the **`main`** branch and the **`/ (root)`** folder, then **Save**.
5. Wait a moment, then open the published URL GitHub shows at the top of the
   Pages settings (it will look like
   `https://<your-username>.github.io/<repo-name>/`).

Because the project uses **relative paths** (`css/style.css`, `js/script.js`)
and has no build step, it works on GitHub Pages as-is — no base-path
configuration needed.

## Data & privacy

Everything is stored client-side under the `ld.*` Local Storage keys
(`ld.tasks`, `ld.quickLinks`, `ld.userName`, `ld.theme`,
`ld.pomodoroDuration`, `ld.taskSort`). Nothing is sent to any server. Clearing
 your browser's site data resets the dashboard to its defaults.
