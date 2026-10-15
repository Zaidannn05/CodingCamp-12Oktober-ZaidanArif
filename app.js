/**
 * app.js — Personal Dashboard
 * Features: Greeting · Focus Timer · To-Do List · Quick Links
 * Challenges: Light/Dark Mode · Custom Name · Prevent Duplicate Tasks
 */

'use strict';

/* ══════════════════════════════════════════════
   STORAGE HELPERS
══════════════════════════════════════════════ */
const Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write failed:', e);
    }
  },
};

/* ══════════════════════════════════════════════
   GREETING MODULE
══════════════════════════════════════════════ */
const Greeting = (() => {
  const elText     = document.getElementById('greeting-text');
  const elName     = document.getElementById('greeting-name');
  const elDatetime = document.getElementById('datetime-text');
  const elModal    = document.getElementById('name-modal');
  const elInput    = document.getElementById('name-input');
  const elSave     = document.getElementById('name-save-btn');
  const elCancel   = document.getElementById('name-cancel-btn');
  const elEditBtn  = document.getElementById('name-edit-btn');

  let intervalId = null;

  /** Return greeting phrase based on hour */
  function getPhrase(hour) {
    if (hour < 5)  return 'Good night,';
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    if (hour < 21) return 'Good evening,';
    return 'Good night,';
  }

  /** Format date: "Thursday, October 15, 2026" */
  function formatDate(d) {
    return d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  /** Format time: "09:47 AM" */
  function formatTime(d) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function update() {
    const now  = new Date();
    const name = Storage.get('userName', '');
    elText.textContent     = getPhrase(now.getHours());
    elName.textContent     = name ? name : 'Friend 👋';
    elDatetime.textContent = `${formatDate(now)} · ${formatTime(now)}`;
  }

  function openModal() {
    elInput.value = Storage.get('userName', '');
    elModal.classList.remove('hidden');
    elInput.focus();
  }

  function closeModal() {
    elModal.classList.add('hidden');
  }

  function saveName() {
    const name = elInput.value.trim();
    Storage.set('userName', name);
    update();
    closeModal();
  }

  function init() {
    update();
    intervalId = setInterval(update, 10_000); // refresh every 10 s

    elEditBtn.addEventListener('click', openModal);
    elSave.addEventListener('click', saveName);
    elCancel.addEventListener('click', closeModal);

    // Save on Enter
    elInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveName();
      if (e.key === 'Escape') closeModal();
    });

    // Close modal on overlay click
    elModal.addEventListener('click', (e) => {
      if (e.target === elModal) closeModal();
    });

    // Show name modal on first visit
    if (!Storage.get('userName')) openModal();
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   THEME MODULE  (Challenge: Light / Dark mode)
══════════════════════════════════════════════ */
const Theme = (() => {
  const html       = document.documentElement;
  const elToggle   = document.getElementById('theme-toggle');
  const elIcon     = document.getElementById('theme-icon');

  function apply(theme) {
    html.setAttribute('data-theme', theme);
    elIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    Storage.set('theme', theme);
  }

  function toggle() {
    const current = html.getAttribute('data-theme');
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    const saved = Storage.get('theme', 'dark');
    apply(saved);
    elToggle.addEventListener('click', toggle);
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   TIMER MODULE
══════════════════════════════════════════════ */
const Timer = (() => {
  const elMinutes  = document.getElementById('timer-minutes');
  const elSeconds  = document.getElementById('timer-seconds');
  const elStart    = document.getElementById('timer-start');
  const elStop     = document.getElementById('timer-stop');
  const elReset    = document.getElementById('timer-reset');
  const elDuration = document.getElementById('timer-duration-input');

  let totalSeconds  = 25 * 60;
  let remainSeconds = totalSeconds;
  let intervalId    = null;
  let running       = false;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function render() {
    const m = Math.floor(remainSeconds / 60);
    const s = remainSeconds % 60;
    elMinutes.textContent = pad(m);
    elSeconds.textContent = pad(s);

    // Update browser tab title when timer is running
    if (running) {
      document.title = `${pad(m)}:${pad(s)} — Focus`;
    } else {
      document.title = 'My Dashboard';
    }
  }

  function tick() {
    if (remainSeconds <= 0) {
      clearInterval(intervalId);
      running = false;
      setButtonState();
      // Notify user
      if (Notification.permission === 'granted') {
        new Notification('Focus session complete! 🎉', {
          body: 'Time to take a short break.',
          icon: '',
        });
      }
      alert('⏰ Focus session complete! Time for a break.');
      return;
    }
    remainSeconds -= 1;
    render();
  }

  function setButtonState() {
    elStart.disabled = running;
    elStop.disabled  = !running;
    elDuration.disabled = running;
  }

  function start() {
    if (running) return;
    // Request notification permission lazily
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    running    = true;
    intervalId = setInterval(tick, 1000);
    setButtonState();
  }

  function stop() {
    if (!running) return;
    clearInterval(intervalId);
    running = false;
    setButtonState();
  }

  function reset() {
    stop();
    const mins    = parseInt(elDuration.value, 10) || 25;
    totalSeconds  = mins * 60;
    remainSeconds = totalSeconds;
    render();
  }

  function init() {
    render();
    elStart.addEventListener('click', start);
    elStop.addEventListener('click', stop);
    elReset.addEventListener('click', reset);

    elDuration.addEventListener('change', () => {
      if (!running) reset();
    });

    // Load saved duration preference
    const savedMins = Storage.get('timerDuration', 25);
    elDuration.value = savedMins;
    reset();

    // Persist duration changes
    elDuration.addEventListener('change', () => {
      Storage.set('timerDuration', parseInt(elDuration.value, 10) || 25);
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   TODO MODULE
   Challenges: Prevent duplicate tasks · Sort tasks
══════════════════════════════════════════════ */
const Todo = (() => {
  const elForm    = document.getElementById('todo-form');
  const elInput   = document.getElementById('todo-input');
  const elList    = document.getElementById('todo-list');
  const elCount   = document.getElementById('todo-count');
  const elSort    = document.getElementById('todo-sort');
  const elWarning = document.getElementById('duplicate-warning');

  let tasks = []; // [{ id, text, done }]

  /* ── helpers ── */
  function save() {
    Storage.set('tasks', tasks);
  }

  function load() {
    tasks = Storage.get('tasks', []);
  }

  function isDuplicate(text) {
    return tasks.some((t) => t.text.toLowerCase() === text.toLowerCase());
  }

  function getSorted() {
    const mode = elSort.value;
    const copy = [...tasks];
    if (mode === 'az')   copy.sort((a, b) => a.text.localeCompare(b.text));
    if (mode === 'za')   copy.sort((a, b) => b.text.localeCompare(a.text));
    if (mode === 'done') copy.sort((a, b) => Number(a.done) - Number(b.done));
    return copy;
  }

  /* ── render ── */
  function render() {
    elList.innerHTML = '';
    const sorted = getSorted();

    sorted.forEach((task) => {
      const li = document.createElement('li');
      li.className = `todo-item${task.done ? ' done' : ''}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" aria-label="Mark done" ${task.done ? 'checked' : ''} />
        <span class="todo-text" title="${escapeHtml(task.text)}">${escapeHtml(task.text)}</span>
        <div class="todo-item-actions">
          <button class="btn-icon edit-btn"   title="Edit task"   aria-label="Edit">✏️</button>
          <button class="btn-icon danger delete-btn" title="Delete task" aria-label="Delete">🗑️</button>
        </div>`;

      elList.appendChild(li);
    });

    // Update count
    const total = tasks.length;
    const done  = tasks.filter((t) => t.done).length;
    elCount.textContent = total === 0
      ? '0 tasks'
      : `${done}/${total} done`;
  }

  /* ── actions ── */
  function addTask(text) {
    tasks.push({ id: Date.now(), text, done: false });
    save();
    render();
  }

  function toggleDone(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      save();
      render();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function startEdit(id, li) {
    const task    = tasks.find((t) => t.id === id);
    if (!task) return;

    const textEl  = li.querySelector('.todo-text');
    const editBtn = li.querySelector('.edit-btn');

    // Replace span with input
    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'todo-edit-input';
    input.value     = task.text;
    input.maxLength = 120;
    input.setAttribute('aria-label', 'Edit task text');
    li.replaceChild(input, textEl);
    editBtn.textContent = '✅';
    editBtn.title = 'Save edit';
    input.focus();

    function commitEdit() {
      const newText = input.value.trim();
      if (!newText) {
        render(); // revert
        return;
      }
      // Duplicate check (ignore self)
      const dup = tasks.some(
        (t) => t.id !== id && t.text.toLowerCase() === newText.toLowerCase()
      );
      if (dup) {
        input.style.borderColor = 'var(--danger)';
        showWarning();
        return;
      }
      task.text = newText;
      save();
      render();
    }

    editBtn.onclick = commitEdit;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') render();
    });
    input.addEventListener('blur', () => setTimeout(render, 150));
  }

  /* ── warning ── */
  let warningTimer = null;
  function showWarning() {
    elWarning.classList.remove('hidden');
    clearTimeout(warningTimer);
    warningTimer = setTimeout(() => elWarning.classList.add('hidden'), 2500);
  }

  /* ── event delegation ── */
  elList.addEventListener('click', (e) => {
    const li = e.target.closest('.todo-item');
    if (!li) return;
    const id = Number(li.dataset.id);

    if (e.target.classList.contains('todo-checkbox')) {
      toggleDone(id);
    } else if (e.target.classList.contains('edit-btn')) {
      startEdit(id, li);
    } else if (e.target.classList.contains('delete-btn')) {
      deleteTask(id);
    }
  });

  elForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = elInput.value.trim();
    if (!text) return;
    if (isDuplicate(text)) {
      showWarning();
      elInput.select();
      return;
    }
    elWarning.classList.add('hidden');
    addTask(text);
    elInput.value = '';
  });

  elSort.addEventListener('change', render);

  function init() {
    load();
    render();
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   QUICK LINKS MODULE
══════════════════════════════════════════════ */
const Links = (() => {
  const elForm      = document.getElementById('link-form');
  const elNameInput = document.getElementById('link-name-input');
  const elUrlInput  = document.getElementById('link-url-input');
  const elGrid      = document.getElementById('links-grid');

  let links = []; // [{ id, name, url }]

  function save() { Storage.set('quickLinks', links); }
  function load() { links = Storage.get('quickLinks', []); }

  /** Ensure URL has a scheme */
  function normalizeUrl(raw) {
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      return 'https://' + raw;
    }
    return raw;
  }

  /** Get favicon URL via Google favicon service */
  function faviconUrl(url) {
    try {
      const origin = new URL(url).origin;
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
    } catch {
      return '';
    }
  }

  function render() {
    elGrid.innerHTML = '';

    if (links.length === 0) {
      elGrid.innerHTML = '<p class="links-empty">No links yet. Add some above!</p>';
      return;
    }

    links.forEach((link) => {
      const chip = document.createElement('div');
      chip.className = 'link-chip';
      chip.innerHTML = `
        <img src="${faviconUrl(link.url)}" width="16" height="16" alt="" onerror="this.style.display='none'" />
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name)}</a>
        <button class="chip-delete" data-id="${link.id}" title="Remove link" aria-label="Remove ${escapeHtml(link.name)}">✕</button>`;
      elGrid.appendChild(chip);
    });
  }

  function addLink(name, url) {
    links.push({ id: Date.now(), name, url });
    save();
    render();
  }

  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    save();
    render();
  }

  elGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip-delete')) {
      deleteLink(Number(e.target.dataset.id));
    }
  });

  elForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = elNameInput.value.trim();
    const url  = normalizeUrl(elUrlInput.value.trim());
    if (!name || !url) return;
    addLink(name, url);
    elNameInput.value = '';
    elUrlInput.value  = '';
  });

  function init() {
    load();
    render();
  }

  return { init };
})();

/* ══════════════════════════════════════════════
   UTILITY
══════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Greeting.init();
  Timer.init();
  Todo.init();
  Links.init();
});
