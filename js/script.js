/* =================================================================
   Life Dashboard — script.js
   Vanilla JavaScript, no frameworks. Everything lives in one IIFE so
   nothing leaks to the global scope. Modules own their DOM references
   and event bindings; events are attached with delegation on stable
   parent containers (no inline onclick handlers anywhere).
   ================================================================= */
(function () {
  "use strict";

  /* ---------- Storage keys & defaults ---------- */
  var KEYS = {
    tasks: "ld.tasks",
    quickLinks: "ld.quickLinks",
    userName: "ld.userName",
    theme: "ld.theme",
    pomodoroDuration: "ld.pomodoroDuration",
    taskSort: "ld.taskSort"
  };

  var DEFAULTS = {
    pomodoroDuration: 25,
    theme: "light",
    taskSort: "newest",
    minDuration: 1,
    maxDuration: 120
  };

  /* Sort comparators. Sorting is applied to a COPY at render time, so the
     stored array is never reordered or modified by sorting (CH-5). */
  var SORT_OPTIONS = {
    newest: function (a, b) { return b.createdAt - a.createdAt; },
    oldest: function (a, b) { return a.createdAt - b.createdAt; },
    completedFirst: function (a, b) { return Number(b.completed) - Number(a.completed); },
    incompleteFirst: function (a, b) { return Number(a.completed) - Number(b.completed); },
    alphabetical: function (a, b) {
      return a.text.localeCompare(b.text, undefined, { sensitivity: "base" });
    }
  };

  /* ---------- Safe Local Storage layer ---------- */
  var Storage = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        var parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false; /* quota exceeded or storage disabled */
      }
    }
  };

  /* ---------- Utilities ---------- */
  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  /* Escape user-provided text before injecting into innerHTML (prevents
     markup injection from task/link/name content). Safe for text and
     attribute contexts because quotes are escaped too. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function formatTime(d) {
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function formatDate(d) {
    return d.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
  }

  function greetingWordFor(d) {
    var h = d.getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  }

  /* Validate + normalize a URL. Prepends https:// when the scheme is
     missing and only accepts http(s). Returns the canonical href or null. */
  function normalizeUrl(input) {
    var value = String(input || "").trim();
    if (!value) return null;
    if (!/^(https?:)?\/\//i.test(value)) {
      value = "https://" + value;
    }
    try {
      var u = new URL(value);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      if (!u.hostname) return null;
      return u.href;
    } catch (e) {
      return null;
    }
  }

  function hostnameOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch (e) { return url; }
  }

  /* ---------- Toast notifications (role=status, polite live region) ---------- */
  var Notify = (function () {
    var el = null;
    var timer = null;

    function init() { el = document.getElementById("notification"); }

    function show(message, type) {
      if (!el) return;
      el.className = "notification" + (type ? " notification--" + type : "");
      el.textContent = message;
      // Force reflow so re-showing the same message re-triggers the transition.
      void el.offsetWidth;
      el.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(hide, 2800);
    }

    function hide() {
      if (el) el.classList.remove("show");
    }

    return { init: init, show: show, hide: hide };
  })();

  /* ---------- Theme (CH-1) ---------- */
  var Theme = (function () {
    var root, headerToggle, settingsToggle, settingsLabel;

    function get() {
      var t = Storage.get(KEYS.theme, DEFAULTS.theme);
      return t === "dark" ? "dark" : "light";
    }

    function set(theme) {
      Storage.set(KEYS.theme, theme);
      apply();
    }

    function toggle() { set(get() === "dark" ? "light" : "dark"); }

    function apply() {
      var dark = get() === "dark";
      root.setAttribute("data-theme", dark ? "dark" : "light");

      headerToggle.setAttribute("aria-pressed", String(dark));
      headerToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");

      settingsToggle.setAttribute("aria-pressed", String(dark));
      settingsLabel.textContent = dark ? "Dark" : "Light";
    }

    function init() {
      root = document.documentElement;
      headerToggle = document.getElementById("themeToggle");
      settingsToggle = document.getElementById("themeToggleSettings");
      settingsLabel = document.getElementById("themeToggleLabel");

      headerToggle.addEventListener("click", toggle);
      settingsToggle.addEventListener("click", toggle);
      apply();
    }

    return { init: init, get: get, set: set, toggle: toggle, apply: apply };
  })();

  /* ---------- Clock (REQ-1) ---------- */
  var Clock = (function () {
    var greetingWordEl, clockEl, dateEl;

    function tick() {
      var now = new Date();
      greetingWordEl.textContent = greetingWordFor(now);
      clockEl.textContent = formatTime(now);
      dateEl.textContent = formatDate(now);
    }

    function init() {
      greetingWordEl = document.getElementById("greetingWord");
      clockEl = document.getElementById("clock");
      dateEl = document.getElementById("dateText");
      tick();
      setInterval(tick, 1000);
    }

    return { init: init, tick: tick };
  })();

  /* ---------- User name (CH-2) ---------- */
  var UserName = (function () {
    var nameArea, settingsInput;
    var editing = false;

    function get() { return String(Storage.get(KEYS.userName, "") || "").trim(); }

    function set(value) {
      var v = String(value || "").trim().slice(0, 40);
      Storage.set(KEYS.userName, v);
      render();
    }

    function startEdit() {
      editing = true;
      render();
      var field = nameArea.querySelector(".name-input");
      if (field) { field.focus(); field.select(); }
    }

    function saveEdit() {
      var field = nameArea.querySelector(".name-input");
      set(field ? field.value : "");
      editing = false;
      render();
    }

    function cancelEdit() {
      editing = false;
      render();
    }

    function render() {
      var name = get();
      settingsInput.value = name;

      if (editing) {
        nameArea.innerHTML =
          '<input class="name-input" type="text" maxlength="40" placeholder="Your name" value="' +
          escapeHtml(name) + '" aria-label="Your name" />' +
          '<button class="name-save" type="button">Save</button>' +
          '<button class="name-cancel" type="button">Cancel</button>';
        return;
      }

      if (name) {
        nameArea.innerHTML =
          ', <button class="name-btn" type="button" title="Click to edit your name">' +
          escapeHtml(name) + '<span class="name-edit-hint" aria-hidden="true">✎</span></button>!';
      } else {
        nameArea.innerHTML =
          ' <button class="name-btn name-btn--empty" type="button" title="Add your name">Add your name</button>';
      }
    }

    function init() {
      nameArea = document.getElementById("nameArea");
      settingsInput = document.getElementById("settingsNameInput");

      // Delegate clicks/keys on the persistent container (survives innerHTML swaps).
      nameArea.addEventListener("click", function (e) {
        var t = e.target.closest("button");
        if (!t) return;
        if (t.classList.contains("name-btn")) startEdit();
        else if (t.classList.contains("name-save")) saveEdit();
        else if (t.classList.contains("name-cancel")) cancelEdit();
      });

      nameArea.addEventListener("keydown", function (e) {
        if (!e.target.classList.contains("name-input")) return;
        if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
        else if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
      });

      // Settings field keeps the inline greeting in sync.
      settingsInput.addEventListener("change", function () { set(settingsInput.value); });
      settingsInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); set(settingsInput.value); settingsInput.blur(); }
      });

      render();
    }

    return { init: init, get: get, set: set, render: render };
  })();

  /* ---------- Pomodoro Focus Timer (REQ-2, CH-3) ---------- */
  var Timer = (function () {
    var RING_R = 90;
    var RING_C = 2 * Math.PI * RING_R;

    var display, ringProgress, card;
    var startBtn, stopBtn, resetBtn;

    var state = {
      durationMin: DEFAULTS.pomodoroDuration,
      remainingSeconds: DEFAULTS.pomodoroDuration * 60,
      running: false,
      intervalId: null,
      endTime: 0
    };

    function getDuration() {
      var d = Storage.get(KEYS.pomodoroDuration, DEFAULTS.pomodoroDuration);
      return clampDuration(typeof d === "number" ? d : parseInt(d, 10));
    }

    function clampDuration(n) {
      n = parseInt(n, 10);
      if (isNaN(n)) n = DEFAULTS.pomodoroDuration;
      return Math.min(DEFAULTS.maxDuration, Math.max(DEFAULTS.minDuration, n));
    }

    function clear() {
      if (state.intervalId) { clearInterval(state.intervalId); state.intervalId = null; }
    }

    function render() {
      var total = state.durationMin * 60;
      var elapsed = total - state.remainingSeconds;
      var fraction = total > 0 ? elapsed / total : 0;
      if (fraction < 0) fraction = 0;
      if (fraction > 1) fraction = 1;

      var m = Math.floor(state.remainingSeconds / 60);
      var s = state.remainingSeconds % 60;
      display.textContent = pad(m) + ":" + pad(s);

      ringProgress.style.strokeDasharray = RING_C;
      ringProgress.style.strokeDashoffset = String(RING_C * fraction);

      card.classList.toggle("timer--running", state.running);
      card.classList.toggle("timer--done", !state.running && state.remainingSeconds === 0 && elapsed >= total);

      startBtn.disabled = state.running;
      stopBtn.disabled = !state.running;

      document.title = state.running
        ? display.textContent + " · Life Dashboard"
        : "Life Dashboard";
    }

    function tick() {
      var remaining = Math.round((state.endTime - Date.now()) / 1000);
      if (remaining <= 0) { complete(); return; }
      state.remainingSeconds = remaining;
      render();
    }

    function complete() {
      clear();
      state.running = false;
      state.remainingSeconds = 0;
      render();
      Notify.show("Focus session complete — nice work! 🎉", "success");
    }

    function start() {
      if (state.running) return;
      clear(); // never allow overlapping intervals
      if (state.remainingSeconds <= 0) state.remainingSeconds = state.durationMin * 60;
      state.endTime = Date.now() + state.remainingSeconds * 1000;
      state.running = true;
      state.intervalId = setInterval(tick, 250); // smooth ring, still per-second display
      tick();
      render();
    }

    function stop() {
      if (!state.running) return;
      clear();
      state.remainingSeconds = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
      state.running = false;
      render();
    }

    function reset() {
      clear();
      state.running = false;
      state.remainingSeconds = state.durationMin * 60;
      render();
    }

    function setDuration(minutes) {
      var next = clampDuration(minutes);
      Storage.set(KEYS.pomodoroDuration, next);
      state.durationMin = next;
      state.running = false;
      clear();
      state.remainingSeconds = next * 60;
      render();
      return next;
    }

    function init() {
      display = document.getElementById("timerDisplay");
      ringProgress = document.querySelector(".ring-progress");
      card = document.querySelector(".timer-card");
      startBtn = document.getElementById("timerStart");
      stopBtn = document.getElementById("timerStop");
      resetBtn = document.getElementById("timerReset");

      state.durationMin = getDuration();
      // Persist the clamped value so storage always holds a valid duration.
      Storage.set(KEYS.pomodoroDuration, state.durationMin);
      state.remainingSeconds = state.durationMin * 60;

      startBtn.addEventListener("click", start);
      stopBtn.addEventListener("click", stop);
      resetBtn.addEventListener("click", reset);

      render();
    }

    return {
      init: init,
      start: start,
      stop: stop,
      reset: reset,
      setDuration: setDuration,
      render: render,
      getDurationMinutes: function () { return state.durationMin; }
    };
  })();

  /* ---------- To-Do tasks (REQ-3, CH-4, CH-5) ---------- */
  var Tasks = (function () {
    var listEl, formEl, inputEl, sortEl, emptyEl;
    var tasks = [];
    var currentSort = DEFAULTS.taskSort;
    var editingId = null;

    function load() {
      var stored = Storage.get(KEYS.tasks, []);
      tasks = Array.isArray(stored) ? stored.filter(isValidTask) : [];
      currentSort = SORT_OPTIONS[Storage.get(KEYS.taskSort, DEFAULTS.taskSort)]
        ? Storage.get(KEYS.taskSort, DEFAULTS.taskSort) : DEFAULTS.taskSort;
    }

    function isValidTask(t) {
      return t && typeof t === "object" && typeof t.text === "string" &&
        typeof t.id === "string" && typeof t.completed === "boolean";
    }

    function save() { Storage.set(KEYS.tasks, tasks); }

    /* Case-insensitive, whitespace-insensitive duplicate check (CH-4). */
    function isDuplicate(text, exceptId) {
      var key = String(text).trim().toLowerCase();
      return tasks.some(function (t) {
        return t.id !== exceptId && t.text.trim().toLowerCase() === key;
      });
    }

    function add(text) {
      var clean = String(text || "").trim();
      if (!clean) { Notify.show("Please enter a task first.", "error"); return; }
      if (isDuplicate(clean)) { Notify.show("That task already exists.", "error"); return; }
      tasks.push({ id: uid(), text: clean, completed: false, createdAt: Date.now() });
      save();
      render();
    }

    function beginEdit(id) { editingId = id; render(); focusEditInput(); }

    function focusEditInput() {
      var li = listEl.querySelector('.task[data-id="' + cssEscape(editingId) + '"]');
      if (li) {
        var input = li.querySelector(".task-edit-input");
        if (input) { input.focus(); input.select(); }
      }
    }

    function commitEdit(id, newText) {
      var clean = String(newText || "").trim();
      if (!clean) { Notify.show("Task text cannot be empty.", "error"); return; }
      if (isDuplicate(clean, id)) { Notify.show("Another task already has that name.", "error"); return; }
      var task = tasks.find(function (t) { return t.id === id; });
      if (task) { task.text = clean; save(); }
      editingId = null;
      render();
    }

    function cancelEdit() { editingId = null; render(); }

    function toggle(id) {
      var task = tasks.find(function (t) { return t.id === id; });
      if (task) { task.completed = !task.completed; save(); render(); }
    }

    function remove(id) {
      tasks = tasks.filter(function (t) { return t.id !== id; });
      if (editingId === id) editingId = null;
      save();
      render();
    }

    function render() {
      // Sort a shallow copy so stored data is never modified by sorting (CH-5).
      var sorted = tasks.slice();
      if (SORT_OPTIONS[currentSort]) sorted.sort(SORT_OPTIONS[currentSort]);

      var html = sorted.map(function (t) {
        if (t.id === editingId) {
          return editRowHtml(t);
        }
        return rowHtml(t);
      }).join("");

      listEl.innerHTML = html;
      emptyEl.hidden = tasks.length > 0;

      if (editingId) focusEditInput();
    }

    function rowHtml(t) {
      return (
        '<li class="task' + (t.completed ? " task--done" : "") + '" data-id="' + escapeHtml(t.id) + '">' +
          '<input type="checkbox" class="task-check"' + (t.completed ? " checked" : "") +
            ' aria-label="' + (t.completed ? "Mark as not done" : "Mark as done") + '" />' +
          '<span class="task-text">' + escapeHtml(t.text) + '</span>' +
          '<div class="task-actions">' +
            '<button class="btn task-edit" type="button">Edit</button>' +
            '<button class="btn task-delete" type="button" aria-label="Delete task">Delete</button>' +
          '</div>' +
        '</li>'
      );
    }

    function editRowHtml(t) {
      return (
        '<li class="task task--editing" data-id="' + escapeHtml(t.id) + '">' +
          '<input type="text" class="task-edit-input" maxlength="200" value="' + escapeHtml(t.text) +
            '" aria-label="Edit task text" />' +
          '<div class="task-actions">' +
            '<button class="btn btn--primary task-save" type="button">Save</button>' +
            '<button class="btn task-cancel" type="button">Cancel</button>' +
          '</div>' +
        '</li>'
      );
    }

    function init() {
      listEl = document.getElementById("taskList");
      formEl = document.getElementById("taskForm");
      inputEl = document.getElementById("taskInput");
      sortEl = document.getElementById("taskSort");
      emptyEl = document.getElementById("taskEmpty");

      load();
      sortEl.value = currentSort;

      formEl.addEventListener("submit", function (e) {
        e.preventDefault();
        add(inputEl.value);
        if (inputEl.value.trim()) inputEl.value = "";
        inputEl.focus();
      });

      sortEl.addEventListener("change", function () {
        currentSort = sortEl.value;
        Storage.set(KEYS.taskSort, currentSort);
        render();
      });

      // Delegate all task interactions on the stable <ul>.
      listEl.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        var li = e.target.closest(".task");
        if (!li) return;
        var id = li.getAttribute("data-id");
        if (!btn) return;
        if (btn.classList.contains("task-edit")) beginEdit(id);
        else if (btn.classList.contains("task-delete")) remove(id);
        else if (btn.classList.contains("task-save")) commitEdit(id, getEditValue(li));
        else if (btn.classList.contains("task-cancel")) cancelEdit();
      });

      listEl.addEventListener("change", function (e) {
        if (!e.target.classList.contains("task-check")) return;
        var li = e.target.closest(".task");
        if (li) toggle(li.getAttribute("data-id"));
      });

      listEl.addEventListener("keydown", function (e) {
        if (!e.target.classList.contains("task-edit-input")) return;
        var li = e.target.closest(".task");
        if (!li) return;
        var id = li.getAttribute("data-id");
        if (e.key === "Enter") { e.preventDefault(); commitEdit(id, e.target.value); }
        else if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
      });

      render();
    }

    function getEditValue(li) {
      var input = li.querySelector(".task-edit-input");
      return input ? input.value : "";
    }

    // Minimal attribute-value escaper for the data-id selector (ids are uuids).
    function cssEscape(v) {
      return String(v).replace(/"/g, '\\"');
    }

    return { init: init, add: add, render: render };
  })();

  /* ---------- Quick Links (REQ-4) ---------- */
  var Links = (function () {
    var formEl, nameInput, urlInput, listEl, emptyEl;
    var links = [];

    function load() {
      var stored = Storage.get(KEYS.quickLinks, []);
      links = Array.isArray(stored) ? stored.filter(isValidLink) : [];
    }

    function isValidLink(l) {
      return l && typeof l === "object" && typeof l.name === "string" &&
        typeof l.url === "string" && typeof l.id === "string";
    }

    function save() { Storage.set(KEYS.quickLinks, links); }

    function add(name, url) {
      var normalized = normalizeUrl(url);
      if (!normalized) { Notify.show("Please enter a valid URL.", "error"); return false; }
      var cleanName = String(name || "").trim();
      if (!cleanName) cleanName = hostnameOf(normalized); // friendly default
      links.push({ id: uid(), name: cleanName.slice(0, 60), url: normalized });
      save();
      render();
      return true;
    }

    function remove(id) {
      links = links.filter(function (l) { return l.id !== id; });
      save();
      render();
    }

    function render() {
      listEl.innerHTML = links.map(function (l) {
        return (
          '<div class="link-item" data-id="' + escapeHtml(l.id) + '">' +
            '<a class="link-button" href="' + escapeHtml(l.url) + '" target="_blank" ' +
              'rel="noopener noreferrer" title="' + escapeHtml(l.url) + '">' +
              escapeHtml(l.name) + '</a>' +
            '<button class="link-delete" type="button" aria-label="Delete ' +
              escapeHtml(l.name) + ' link" title="Delete link">×</button>' +
          '</div>'
        );
      }).join("");
      emptyEl.hidden = links.length > 0;
    }

    function init() {
      formEl = document.getElementById("linkForm");
      nameInput = document.getElementById("linkName");
      urlInput = document.getElementById("linkUrl");
      listEl = document.getElementById("linkList");
      emptyEl = document.getElementById("linkEmpty");

      load();

      formEl.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = add(nameInput.value, urlInput.value);
        if (ok) { nameInput.value = ""; urlInput.value = ""; urlInput.focus(); }
      });

      listEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".link-delete");
        if (!btn) return;
        var item = btn.closest(".link-item");
        if (item) remove(item.getAttribute("data-id"));
      });

      render();
    }

    return { init: init, add: add, render: render };
  })();

  /* ---------- Settings wiring (duration input -> Timer) ---------- */
  function initSettingsForm() {
    var durationInput = document.getElementById("durationInput");
    var durationSave = document.getElementById("durationSave");

    // Reflect the (clamped, validated) duration the Timer actually loaded.
    durationInput.value = Timer.getDurationMinutes();

    function apply() {
      var raw = parseInt(durationInput.value, 10);
      var current = Timer.getDurationMinutes();
      if (isNaN(raw)) {
        Notify.show("Enter a number of minutes.", "error");
        durationInput.value = current;
        return;
      }
      if (raw < DEFAULTS.minDuration || raw > DEFAULTS.maxDuration) {
        Notify.show("Pomodoro length must be between " + DEFAULTS.minDuration +
          " and " + DEFAULTS.maxDuration + " minutes.", "error");
        durationInput.value = current;
        return;
      }
      var applied = Timer.setDuration(raw); // validates + clamps + resets timer
      durationInput.value = applied;
      Notify.show("Focus timer set to " + applied + " minutes.", "success");
    }

    durationSave.addEventListener("click", apply);
    durationInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); apply(); }
    });
  }

  /* ---------- Bootstrap ---------- */
  function init() {
    Notify.init();
    Theme.init();
    Clock.init();
    UserName.init();
    Timer.init();
    Tasks.init();
    Links.init();
    initSettingsForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
