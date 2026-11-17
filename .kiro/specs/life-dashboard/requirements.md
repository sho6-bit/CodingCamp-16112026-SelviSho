# Life Dashboard — Requirements

## Overview
A single-page **To-Do List Life Dashboard** built with HTML5, CSS3, and vanilla
JavaScript only. All data is persisted client-side with the Local Storage API.
No frameworks, no build tools, no backend.

## Stack & Constraints
- HTML5 structure, CSS3 styling, vanilla JavaScript (no React/Vue/Angular).
- Exactly one CSS file: `css/style.css`.
- Exactly one JavaScript file: `js/script.js`.
- No backend server; all data in Local Storage (client-side only).
- No inline CSS/JS in `index.html` except a minimal theme bootstrap to prevent
  a flash of the wrong theme on load.
- Works in Chrome, Firefox, Edge, Safari.
- Deployable as static files (GitHub Pages compatible).

## Functional Requirements

### MVP

**REQ-1 Greeting Dashboard**
- REQ-1.1 Display the current time, updating in real time.
- REQ-1.2 Display the current date.
- REQ-1.3 Show a time-based greeting: "Good Morning", "Good Afternoon", or
  "Good Evening".
- REQ-1.4 Update the time automatically without user action.

**REQ-2 Focus Timer (Pomodoro)**
- REQ-2.1 Default duration 25 minutes.
- REQ-2.2 Start, Stop, and Reset controls.
- REQ-2.3 Display remaining time in `MM:SS`.
- REQ-2.4 Update the countdown every second.
- REQ-2.5 Prevent multiple simultaneous timer intervals.
- REQ-2.6 Controls behave correctly (start resumes/pauses cleanly, reset
  returns to full duration).

**REQ-3 To-Do List**
- REQ-3.1 Add new tasks.
- REQ-3.2 Edit existing tasks.
- REQ-3.3 Mark tasks as completed.
- REQ-3.4 Delete tasks.
- REQ-3.5 Persist tasks in Local Storage.
- REQ-3.6 Restore tasks after a browser refresh.
- REQ-3.7 Clear visual distinction between completed and incomplete tasks.

**REQ-4 Quick Links**
- REQ-4.1 Add a website name and URL, then save.
- REQ-4.2 Open saved sites via clickable buttons.
- REQ-4.3 Delete saved links.
- REQ-4.4 Persist links in Local Storage.
- REQ-4.5 Validate URLs.
- REQ-4.6 Open external sites safely in a new tab (`rel="noopener noreferrer"`).

### Challenges (all five required)

**CH-1 Light / Dark Mode**
- CH-1.1 A theme toggle.
- CH-1.2 Light and dark themes.
- CH-1.3 All components adapt to the selected theme.
- CH-1.4 Persist the selected theme.
- CH-1.5 Restore the previous theme on reopen.

**CH-2 Custom Name in Greeting**
- CH-2.1 Enter a preferred name.
- CH-2.2 Display the name in the greeting.
- CH-2.3 Edit the name.
- CH-2.4 Persist the name.
- CH-2.5 Restore the custom greeting after refresh.

**CH-3 Change Pomodoro Time**
- CH-3.1 Customize the Pomodoro duration via a settings input.
- CH-3.2 Validate the entered duration.
- CH-3.3 Update the timer from the selected duration.
- CH-3.4 Persist the preferred duration.
- CH-3.5 Reset the timer correctly when the duration changes.

**CH-4 Prevent Duplicate Tasks**
- CH-4.1 Prevent adding a duplicate task.
- CH-4.2 Compare case-insensitively.
- CH-4.3 Ignore leading/trailing whitespace.
- CH-4.4 Show a friendly notification when a duplicate is detected.
- CH-4.5 Do not create duplicate entries.

**CH-5 Sort Tasks**
- CH-5.1 Sort by: newest first, oldest first, completed first, incomplete
  first, alphabetical.
- CH-5.2 Sorting must not delete or modify task data.
- CH-5.3 Maintain task state after sorting and after refresh (persist the
  chosen sort).

## Non-Functional Requirements
- NFR-1 Clean, modern, minimal, responsive layout (desktop, tablet, mobile).
- NFR-2 Sections: greeting/date/time, focus timer, to-do list, quick links,
  theme & personalization settings.
- NFR-3 Accessible contrast, readable typography, clear button states.
- NFR-4 Meaningful names, small focused functions, no needless duplication,
  consistent formatting, comments only where non-obvious.
- NFR-5 Handle invalid input gracefully; avoid global variables.
- NFR-6 Preserve the `.kiro` directory.
