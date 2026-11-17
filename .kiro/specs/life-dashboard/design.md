# Life Dashboard — Design

## File Structure
```
project/
├── .kiro/                      # Kiro specs (required for submission)
├── css/
│   └── style.css               # the only stylesheet
├── js/
│   └── script.js               # the only script
├── index.html
└── README.md
```

## Page Layout (CSS Grid with named areas)
- Mobile (1 col): greeting → timer → settings → todo → links (stacked).
- Tablet (≥720px, 2 col): `greeting greeting` / `timer settings` / `todo todo` /
  `links links`.
- Desktop (≥1024px, 3 col): `greeting greeting greeting` / `timer settings links` /
  `todo todo todo`.

A header bar holds the app title and a quick theme-toggle icon button.

## Local Storage Keys (all namespaced `ld.`)
| Key                  | Type    | Default | Purpose                          |
|----------------------|---------|---------|----------------------------------|
| `ld.tasks`           | array   | `[]`    | To-do tasks                      |
| `ld.quickLinks`      | array   | `[]`    | Quick link bookmarks             |
| `ld.userName`        | string  | `""`    | Custom greeting name             |
| `ld.theme`           | string  | `"light"` | `"light"` or `"dark"`           |
| `ld.pomodoroDuration`| number  | `25`    | Minutes (valid 1–120)            |
| `ld.taskSort`        | string  | `"newest"` | Active sort option              |

All values stored as JSON. Reads are wrapped in try/catch with sensible
fallbacks so missing/invalid data never breaks the app.

## Data Model
```
Task      { id: string, text: string, completed: boolean, createdAt: number }
QuickLink { id: string, name: string, url: string }   // url normalized to https://
```
- `id` from `crypto.randomUUID()` with a fallback generator.
- `createdAt` is `Date.now()`; used for newest/oldest sort.

## Theming
- `data-theme` attribute on `<html>` (`light` | `dark`).
- A 4-line inline script in `<head>` applies the saved theme before first paint
  to prevent a flash of the wrong theme. All other logic lives in `script.js`.
- CSS custom properties drive every color; switching the attribute restyles all
  components via the variables.

## JavaScript Architecture (single IIFE, no globals)
Modules inside one IIFE, each owning its DOM refs and events:
- `Storage` — safe `get`/`set`/`remove` with JSON + try/catch.
- `utils` — `uid`, `escapeHtml`, `normalizeUrl`, time/date/greeting formatters.
- `Notify` — transient toast region (`role="status"`, `aria-live="polite"`).
- `Theme` — get/set/toggle/apply; updates header + settings toggles.
- `Clock` — updates time, date, greeting word every second.
- `UserName` — get/set/render; inline edit-in-place in greeting; syncs settings.
- `Timer` — drift-free Pomodoro using an `endTime` timestamp; Start/Stop/Reset;
  SVG progress ring; completes with a notification.
- `Tasks` — add/edit/toggle/delete/render; duplicate guard; sorting (render-time
  copy, never mutates stored data); empty states.
- `Links` — add/delete/render; URL validation + https:// normalization; safe
  `target="_blank" rel="noopener noreferrer"` anchors.
- `init` — wires everything on `DOMContentLoaded`.

Events are bound with delegation on stable parent containers; no inline
`onclick` handlers anywhere.

## Key Behaviors
- **Timer**: `start` resumes from remaining seconds (or full duration if 0),
  computes `endTime = now + remaining*1000`, ticks at 250ms for a smooth ring.
  `stop` pauses (keeps remaining). `reset` returns to full duration and stops.
  Interval is always cleared before a new one is created.
- **Duplicate tasks**: compared as `text.trim().toLowerCase()`. Editing also
  rejects duplicates against all other tasks. Detected → toast, no entry.
- **Sorting**: `Tasks.render()` sorts a shallow copy by `ld.taskSort`; the
  stored array order is untouched so data is never modified by sorting.
- **URL safety**: missing protocol gets `https://` prepended; only `http(s)`
  schemes are accepted; opens via anchor with `rel="noopener noreferrer"`.
- **Duration change**: validated to 1–120, saved, and the timer is reset.
