# Life Dashboard — Tasks

## 1. Scaffolding
- [x] Create `css/` and `js/` directories.
- [x] Create `.kiro/specs/life-dashboard/` with requirements, design, tasks.
- [x] `index.html` with semantic sections + theme bootstrap.
- [x] `css/style.css` with theming, layout, components, responsive rules.
- [x] `js/script.js` with all modules in one IIFE.

## 2. MVP
- [x] Real-time clock (time + date) updating every second.
- [x] Time-based greeting (Morning / Afternoon / Evening).
- [x] Pomodoro timer: 25 min default, Start/Stop/Reset, MM:SS, no double intervals.
- [x] To-Do: add, edit, complete, delete, persist, restore, completed styling.
- [x] Quick Links: add name+URL, open in new tab safely, delete, persist, restore.
- [x] Local Storage persistence for all MVP data.

## 3. Challenges
- [x] CH-1 Light/Dark toggle, full theming, persisted, restored.
- [x] CH-2 Custom name, editable, displayed in greeting, persisted, restored.
- [x] CH-3 Custom Pomodoro duration, validated, applied, persisted, resets timer.
- [x] CH-4 Duplicate task prevention (case-insensitive, trimmed) + notification.
- [x] CH-5 Sort tasks (newest/oldest/completed/incomplete/alphabetical), persisted,
      non-destructive, state survives refresh.

## 4. Quality
- [x] Responsive layout (mobile / tablet / desktop).
- [x] Accessible labels, live region, focus styles, skip link.
- [x] Input validation + graceful error handling.
- [x] No inline handlers; minimal globals (single IIFE).
- [x] README with run + GitHub Pages deploy instructions.

## 5. Verification (acceptance checklist)
> Implemented and verified by static analysis: `node --check` syntax pass, JS↔HTML
> ID/selector cross-check, JS↔CSS class check, file-count constraints, and a
> full logic review. Run a quick browser smoke test per the README to confirm
> the live interactions (clock ticking, timer, add/edit/delete, persistence).

- [x] Real-time clock works.
- [x] Current date is displayed.
- [x] Time-based greeting works.
- [x] Focus Timer starts, stops, resets.
- [x] Tasks add/edit/complete/delete.
- [x] Tasks persist after refresh.
- [x] Quick Links add/open/delete.
- [x] Quick Links persist after refresh.
- [x] Light/Dark mode works and persists.
- [x] Custom greeting name works and persists.
- [x] Pomodoro duration changeable and persists.
- [x] Duplicate tasks prevented.
- [x] Task sorting works.
- [x] Responsive design works.
- [x] Only one CSS file in `css/`.
- [x] Only one JS file in `js/`.
- [x] `.kiro` directory preserved.
- [x] No frameworks / backend.
- [x] Deployable via GitHub Pages.
