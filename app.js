/* ===================================================
   StickyDesk — app.js
   =================================================== */

'use strict';

// ===================================================
// CONSTANTS
// ===================================================

const COLORS = {
  themed: ['#FFE566', '#FFAAAA', '#AAD4FF', '#AAFFD4', '#FFD4AA', '#D4AAFF'],
  bright: ['#FF4F8B', '#FF6B35', '#FFD100', '#00D4AA', '#9B59B6', '#2980B9'],
  muted:  ['#D4C9A8', '#C9B0A8', '#A8B8C9', '#A8C9B3', '#C3AEC9', '#C9BEA8']
};

// ===================================================
// ENVIRONMENT DECORATIONS
// ===================================================

const DECOR_HTML = {
  student: `
    <div class="decor d-pencil-divet"></div>
    <div class="decor d-pencil" data-draggable="true">
      <div class="p-tip"></div>
      <div class="p-wood"></div>
      <div class="p-body"></div>
      <div class="p-ferrule"></div>
      <div class="p-eraser"></div>
    </div>
    <div class="decor d-apple" data-draggable="true">
      <div class="a-leaf"></div>
      <div class="a-stem"></div>
      <div class="a-body"></div>
    </div>`,

  professional: `
    <div class="decor d-mouse" data-draggable="true"><div class="m-wheel"></div></div>
    <div class="decor d-pen" data-draggable="true"></div>`,

  easel: `
    <div class="decor d-easel-shelf"></div>
    <div class="decor d-palette" data-draggable="true">
      <div class="p-base">
        <div class="p-thumb-hole"></div>
        <div class="pb pb-red"></div>
        <div class="pb pb-blue"></div>
        <div class="pb pb-yellow"></div>
        <div class="pb pb-green"></div>
        <div class="pb pb-white"></div>
      </div>
    </div>
    <div class="decor d-brush" data-draggable="true">
      <div class="br-handle"></div>
      <div class="br-ferrule"></div>
      <div class="br-bristles"></div>
    </div>`,

  whiteboard: `
    <div class="decor d-marker-tray">
      <div class="tray-marker tray-marker-red"></div>
      <div class="tray-marker tray-marker-blue"></div>
      <div class="tray-marker tray-marker-black"></div>
      <div class="tray-marker tray-marker-green"></div>
      <div class="tray-marker tray-marker-purple"></div>
      <div class="tray-eraser"></div>
    </div>`,

  fridge: `
    <div class="decor d-fridge-handle">
      <div class="fh-mount fh-mount-top"></div>
      <div class="fh-bar"></div>
      <div class="fh-mount fh-mount-bottom"></div>
    </div>
    <div class="decor d-fridge-magnet fm-red"></div>
    <div class="decor d-fridge-magnet fm-blue"></div>
    <div class="decor d-fridge-magnet fm-yellow"></div>`,

  chalkboard: `
    <div class="decor d-chalk-tray">
      <div class="chalk-stick ck-white"></div>
      <div class="chalk-stick ck-yellow"></div>
      <div class="chalk-stick ck-white"></div>
      <div class="chalk-stick ck-pink"></div>
      <div class="chalk-stick ck-blue"></div>
      <div class="chalk-felt-eraser"></div>
    </div>`
};

function getDecorKey(el) {
  return Array.from(el.classList).find(c => c.startsWith('d-') && c !== 'decor') || el.className;
}

function renderDecor() {
  const envDecorEl = document.getElementById('envDecor');
  if (!envDecorEl) return;
  const env = state.settings.environment;
  envDecorEl.innerHTML = DECOR_HTML[env] || '';

  // Apply stored positions and bind drag to draggable decors
  const positions = (state.settings.decorPositions || {})[env] || {};
  envDecorEl.querySelectorAll('.decor[data-draggable]').forEach(decor => {
    const key = getDecorKey(decor);
    if (positions[key]) {
      decor.style.left   = positions[key].x + 'px';
      decor.style.top    = positions[key].y + 'px';
      decor.style.bottom = 'auto';
      decor.style.right  = 'auto';
    }
    decor.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      startDecorDrag(e, decor, key, env);
    });
    decor.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      e.stopPropagation();
      e.preventDefault();
      startDecorDrag(normalizePointer(e), decor, key, env);
    }, { passive: false });
  });
}

// ===================================================
// ENVIRONMENT NAMES  (for desk title)
// ===================================================

const ENV_NAMES = {
  student:      'Student Desk',
  professional: 'Work Desk',
  easel:        'Art Easel',
  whiteboard:   'Whiteboard',
  fridge:       'Fridge Door',
  chalkboard:   'Chalkboard'
};

const NOTE_W     = 185;   // sticky note width  (px)
const NOTE_H     = 185;   // sticky note height (px)
const GRID_PAD   = 20;    // padding from desk edges (px)
const GRID_CELL  = 215;   // cell pitch: note + gap  (px)
const GRID_COLS  = 4;     // columns in grid mode

// ===================================================
// STATE
// ===================================================

const defaultState = () => ({
  settings: {
    colorTheme:     'themed',
    textColor:      'black',
    environment:    'student',
    layoutMode:     'free',
    fontSize:       'medium',
    decorPositions: {}
  },
  envPages: {
    student:      [{ id: 0, notes: [] }],
    professional: [{ id: 0, notes: [] }],
    easel:        [{ id: 0, notes: [] }],
    whiteboard:   [{ id: 0, notes: [] }],
    fridge:       [{ id: 0, notes: [] }],
    chalkboard:   [{ id: 0, notes: [] }]
  },
  envCurrentPage: {},
  noteIdCounter:  0
});

let state = loadState() || defaultState();

// ===================================================
// PER-ENVIRONMENT PAGE HELPERS
// ===================================================

function getPages() {
  const env = state.settings.environment;
  if (!state.envPages)         state.envPages = {};
  if (!state.envPages[env])    state.envPages[env] = [{ id: 0, notes: [] }];
  return state.envPages[env];
}

function getCurrentPage() {
  const env = state.settings.environment;
  if (!state.envCurrentPage) state.envCurrentPage = {};
  var p = state.envCurrentPage[env];
  return (p !== undefined && p !== null) ? p : 0;
}

function setCurrentPage(i) {
  if (!state.envCurrentPage) state.envCurrentPage = {};
  state.envCurrentPage[state.settings.environment] = i;
}

// ===================================================
// DOM REFS  (assigned in init() after DOM is ready)
// ===================================================

let deskSurface;
let gridOverlay;
let pageInfo;
let settingsPanel;
let settingsOverlay;

// ===================================================
// DRAG STATE
// ===================================================

let drag        = null;
let decorDrag   = null;
let touchPending = null;   // { el, noteData, startX, startY } — waiting to become a drag
const DRAG_THRESHOLD = 8;  // px of movement before a touch is treated as a drag

// ===================================================
// INIT
// ===================================================

function init() {
  // Grab DOM refs here — guaranteed to run after DOM is ready
  deskSurface    = document.getElementById('deskSurface');
  gridOverlay    = document.getElementById('gridOverlay');
  pageInfo       = document.getElementById('pageInfo');
  settingsPanel  = document.getElementById('settingsPanel');
  settingsOverlay = document.getElementById('settingsOverlay');

  // Ensure per-env pages structure is valid for current environment
  if (!state.envPages)      state.envPages      = {};
  if (!state.envCurrentPage) state.envCurrentPage = {};
  const pages = getPages();
  if (pages.length === 0) pages.push({ id: 0, notes: [] });
  if (getCurrentPage() >= pages.length) setCurrentPage(0);

  buildColorSwatches();
  syncSettingsUI();
  applySettings();
  renderPage();
  bindEvents();
}

// ===================================================
// COLOR SWATCHES
// ===================================================

function buildColorSwatches() {
  Object.keys(COLORS).forEach(theme => {
    const el = document.getElementById('swatches-' + theme);
    if (!el) return;
    el.innerHTML = '';
    COLORS[theme].forEach(c => {
      const s = document.createElement('span');
      s.className = 'swatch';
      s.style.background = c;
      el.appendChild(s);
    });
  });
}

// ===================================================
// SETTINGS — sync UI to state
// ===================================================

function syncSettingsUI() {
  const s = state.settings;

  // Radio buttons
  const ctRadio = document.querySelector(`[name="colorTheme"][value="${s.colorTheme}"]`);
  if (ctRadio) ctRadio.checked = true;

  const envRadio = document.querySelector(`[name="environment"][value="${s.environment}"]`);
  if (envRadio) envRadio.checked = true;

  const lmRadio = document.querySelector(`[name="layoutMode"][value="${s.layoutMode}"]`);
  if (lmRadio) lmRadio.checked = true;

  // Toggle buttons
  updateTextColorUI();
  updateFontSizeUI();

  // Selected card highlights
  refreshAllCards();
}

function updateTextColorUI() {
  const isBlack = state.settings.textColor === 'black';
  document.getElementById('textColorBlack').classList.toggle('active', isBlack);
  document.getElementById('textColorWhite').classList.toggle('active', !isBlack);
}

function updateFontSizeUI() {
  const sz = state.settings.fontSize || 'medium';
  ['small', 'medium', 'large'].forEach(s => {
    const sizeEl = document.getElementById('size' + s.charAt(0).toUpperCase() + s.slice(1));
    if (sizeEl) sizeEl.classList.toggle('active', s === sz);
  });
}

function updateDeskTitle() {
  const el = document.getElementById('deskTitle');
  if (el) el.textContent = ENV_NAMES[state.settings.environment] || 'StickyDesk';
}

function refreshAllCards() {
  // Option cards (colorTheme, layoutMode)
  document.querySelectorAll('.option-card').forEach(card => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio) card.classList.toggle('selected', radio.checked);
  });

  // Env cards
  document.querySelectorAll('.env-card').forEach(card => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio) card.classList.toggle('selected', radio.checked);
  });
}

// ===================================================
// APPLY SETTINGS TO DOM
// ===================================================

function applySettings() {
  const { colorTheme, textColor, environment, layoutMode, fontSize } = state.settings;
  const body = document.body;

  // Swap body classes
  body.className = body.className
    .replace(/\benv-\S+|\btheme-\S+|\btext-\S+|\bmode-\S+|\bfontsize-\S+/g, '')
    .trim();

  body.classList.add(
    `env-${environment}`,
    `theme-${colorTheme}`,
    `text-${textColor}`,
    `mode-${layoutMode}`,
    `fontsize-${fontSize || 'medium'}`
  );

  buildGridOverlay();
  renderDecor();
  updateDeskTitle();
}

// ===================================================
// GRID OVERLAY
// ===================================================

function buildGridOverlay() {
  if (!gridOverlay) return;
  gridOverlay.innerHTML = '';
  if (state.settings.layoutMode !== 'grid') return;

  const deskH = deskSurface.clientHeight;
  const rows = Math.max(4, Math.floor((deskH - GRID_PAD * 2 + 15) / GRID_CELL));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.style.left   = (GRID_PAD + c * GRID_CELL) + 'px';
      cell.style.top    = (GRID_PAD + r * GRID_CELL) + 'px';
      cell.style.width  = NOTE_W + 'px';
      cell.style.height = NOTE_H + 'px';
      gridOverlay.appendChild(cell);
    }
  }
}

// ===================================================
// PAGE RENDERING
// ===================================================

function renderPage() {
  if (!deskSurface || !pageInfo) return;
  deskSurface.querySelectorAll('.sticky-note').forEach(el => el.remove());

  const pages = getPages();
  const cp    = getCurrentPage();
  const page  = pages[cp];
  if (!page) return;

  page.notes.forEach(n => createNoteElement(n));

  pageInfo.textContent = `${cp + 1} / ${pages.length}`;

  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  prev.disabled = (cp === 0);
  next.disabled = (cp === pages.length - 1);
}

// ===================================================
// NOTE ELEMENT CREATION
// ===================================================

function noteColor(noteData) {
  const palette = COLORS[state.settings.colorTheme];
  return palette[noteData.colorIndex % palette.length];
}

function createNoteElement(noteData) {
  const el = document.createElement('div');
  el.className = 'sticky-note';
  el.id = noteData.id;

  const color = noteColor(noteData);
  el.style.backgroundColor = color;
  el.style.left = noteData.x + 'px';
  el.style.top  = noteData.y + 'px';

  if (noteData.rotation && state.settings.layoutMode === 'free') {
    el.style.transform = `rotate(${noteData.rotation}deg)`;
  }

  el.innerHTML = `
    <div class="note-header">
      <div class="note-actions">
        <button class="note-action-btn" data-action="bullet"   title="Bullet point (•)">•</button>
        <button class="note-action-btn" data-action="number"   title="Numbered item">1.</button>
        <button class="note-action-btn" data-action="checkbox" title="Checkbox (☐)">☐</button>
      </div>
      <button class="note-delete" title="Delete note">&#10005;</button>
    </div>
    <textarea class="note-content" placeholder="Write your note..."></textarea>
  `;

  const ta = el.querySelector('.note-content');
  ta.value = noteData.content;
  ta.style.color = state.settings.textColor === 'white' ? '#ffffff' : '#1a1a1a';

  // Delete
  const deleteBtn = el.querySelector('.note-delete');
  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    deleteNote(noteData.id);
  });

  // Quick-entry action buttons
  el.querySelectorAll('.note-action-btn').forEach(btn => {
    btn.addEventListener('mousedown', e => e.stopPropagation());
    btn.addEventListener('click', e => {
      e.stopPropagation();
      handleNoteAction(btn.dataset.action, ta, noteData);
    });
  });

  // Content
  ta.addEventListener('input', () => {
    noteData.content = ta.value;
    saveState();
  });

  // Checkbox toggle: clicking on ☐ toggles to ☑ and vice versa
  ta.addEventListener('click', () => {
    const pos = ta.selectionStart;
    const val = ta.value;
    let changed = false;
    for (let i = Math.max(0, pos - 1); i <= Math.min(val.length - 1, pos); i++) {
      if (val[i] === '☐') {
        ta.value = val.substring(0, i) + '☑' + val.substring(i + 1);
        ta.selectionStart = ta.selectionEnd = pos;
        changed = true; break;
      } else if (val[i] === '☑') {
        ta.value = val.substring(0, i) + '☐' + val.substring(i + 1);
        ta.selectionStart = ta.selectionEnd = pos;
        changed = true; break;
      }
    }
    if (changed) { noteData.content = ta.value; saveState(); }
  });

  // Prevent drag when clicking/touching textarea
  ta.addEventListener('mousedown', e => e.stopPropagation());
  ta.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

  // Drag — mouse
  el.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    startDrag(e, el, noteData);
  });
  // Drag — touch: passive so click events are never suppressed.
  // Actual drag is started in the document touchmove once the finger moves enough.
  el.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    if (e.target.closest('button') || e.target.tagName === 'TEXTAREA') return;
    touchPending = {
      el,
      noteData,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY
    };
  }, { passive: true });

  deskSurface.appendChild(el);
  return el;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===================================================
// NOTE CRUD
// ===================================================

function addNote() {
  const page = getPages()[getCurrentPage()];
  const colors = COLORS[state.settings.colorTheme];
  const colorIndex = page.notes.length % colors.length;

  let x, y, rotation;

  if (state.settings.layoutMode === 'grid') {
    const pos = findFreeGridCell(page.notes);
    x = GRID_PAD + pos.col * GRID_CELL;
    y = GRID_PAD + pos.row * GRID_CELL;
    rotation = 0;
  } else {
    // Centre of desk with slight random offset
    const w = deskSurface ? deskSurface.clientWidth  : 800;
    const h = deskSurface ? deskSurface.clientHeight : 600;
    x = (w - NOTE_W) / 2 + (Math.random() - 0.5) * 80;
    y = (h - NOTE_H) / 2 + (Math.random() - 0.5) * 80;
    x = Math.max(GRID_PAD, Math.min(w - NOTE_W - GRID_PAD, x));
    y = Math.max(GRID_PAD, Math.min(h - NOTE_H - GRID_PAD, y));
    rotation = +(Math.random() * 6 - 3).toFixed(2);
  }

  const noteData = {
    id:         'note-' + (++state.noteIdCounter),
    content:    '',
    colorIndex,
    x:          Math.floor(x),
    y:          Math.floor(y),
    rotation
  };

  page.notes.push(noteData);
  const el = createNoteElement(noteData);
  saveState();

  // Auto-focus textarea
  setTimeout(() => el.querySelector('.note-content').focus(), 30);
}

function deleteNote(id) {
  const page = getPages()[getCurrentPage()];
  page.notes = page.notes.filter(n => n.id !== id);
  const noteEl = document.getElementById(id);
  if (noteEl) noteEl.remove();
  saveState();
}

function clearCurrentPage() {
  if (!confirm('Clear all notes on this page?')) return;
  const page = getPages()[getCurrentPage()];
  page.notes = [];
  deskSurface.querySelectorAll('.sticky-note').forEach(el => el.remove());
  saveState();
}

// ===================================================
// GRID HELPERS
// ===================================================

function findFreeGridCell(notes) {
  const occupied = new Set(
    notes.map(n => {
      const c = Math.round((n.x - GRID_PAD) / GRID_CELL);
      const r = Math.round((n.y - GRID_PAD) / GRID_CELL);
      return `${c},${r}`;
    })
  );

  for (let r = 0; r < 50; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!occupied.has(`${c},${r}`)) return { col: c, row: r };
    }
  }
  return { col: 0, row: 0 };
}

function snapToGrid(x, y) {
  const deskW = deskSurface.clientWidth;
  const deskH = deskSurface.clientHeight;

  let col = Math.round((x - GRID_PAD) / GRID_CELL);
  let row = Math.round((y - GRID_PAD) / GRID_CELL);

  col = Math.max(0, Math.min(GRID_COLS - 1, col));
  row = Math.max(0, row);

  const sx = GRID_PAD + col * GRID_CELL;
  const sy = GRID_PAD + row * GRID_CELL;

  return {
    x: Math.min(sx, deskW - NOTE_W),
    y: Math.min(sy, deskH - NOTE_H)
  };
}

// ===================================================
// DRAG & DROP
// ===================================================

// Normalise mouse or touch events to a common {clientX, clientY, preventDefault} shape
function normalizePointer(e) {
  const src = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  if (src) return { clientX: src.clientX, clientY: src.clientY, preventDefault: () => e.preventDefault(), button: 0 };
  return e;
}

function startDrag(e, el, noteData) {
  e.preventDefault();

  const rect     = el.getBoundingClientRect();
  const deskRect = deskSurface.getBoundingClientRect();

  // Lift to front
  el.style.zIndex = '1000';
  el.classList.add('dragging');

  // Remove rotation during drag for cleaner feel
  el.style.transform = 'rotate(-1.5deg) scale(1.04)';

  drag = {
    el,
    noteData,
    offsetX:  e.clientX - rect.left,
    offsetY:  e.clientY - rect.top,
    deskRect,
    originalRotation: noteData.rotation || 0
  };
}

function startDecorDrag(e, decorEl, key, env) {
  e.preventDefault();
  const rect       = decorEl.getBoundingClientRect();
  const deskRect   = deskSurface.getBoundingClientRect();
  const envDecorEl = document.getElementById('envDecor');

  // Commit current visual position as explicit left/top so CSS bottom/right won't fight
  decorEl.style.bottom = 'auto';
  decorEl.style.right  = 'auto';
  decorEl.style.left   = (rect.left - deskRect.left) + 'px';
  decorEl.style.top    = (rect.top  - deskRect.top)  + 'px';
  if (envDecorEl) envDecorEl.style.zIndex = '999';

  decorDrag = {
    el:      decorEl,
    key,
    env,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    deskRect
  };
}

function onMouseMove(e) {
  if (drag) {
    const { el, offsetX, offsetY, deskRect } = drag;
    let x = e.clientX - deskRect.left - offsetX;
    let y = e.clientY - deskRect.top  - offsetY;
    x = Math.max(0, Math.min(deskRect.width  - NOTE_W, x));
    y = Math.max(0, Math.min(deskRect.height - NOTE_H, y));
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  } else if (decorDrag) {
    const { el, offsetX, offsetY, deskRect } = decorDrag;
    el.style.left = (e.clientX - deskRect.left - offsetX) + 'px';
    el.style.top  = (e.clientY - deskRect.top  - offsetY) + 'px';
  }
}

function onMouseUp(e) {
  if (drag) {
    const { el, noteData, offsetX, offsetY, deskRect, originalRotation } = drag;

    let x = e.clientX - deskRect.left - offsetX;
    let y = e.clientY - deskRect.top  - offsetY;

    x = Math.max(0, Math.min(deskRect.width  - NOTE_W, x));
    y = Math.max(0, Math.min(deskRect.height - NOTE_H, y));

    if (state.settings.layoutMode === 'grid') {
      const snapped = snapToGrid(x, y);
      x = snapped.x;
      y = snapped.y;
      el.style.transform = 'rotate(0deg)';
      noteData.rotation  = 0;
    } else {
      el.style.transform = `rotate(${originalRotation}deg)`;
    }

    el.style.left   = x + 'px';
    el.style.top    = y + 'px';
    el.style.zIndex = '';
    el.classList.remove('dragging');

    noteData.x = Math.floor(x);
    noteData.y = Math.floor(y);

    drag = null;
    saveState();

  } else if (decorDrag) {
    const { el, key, env, offsetX, offsetY, deskRect } = decorDrag;
    const x = Math.floor(e.clientX - deskRect.left - offsetX);
    const y = Math.floor(e.clientY - deskRect.top  - offsetY);

    el.style.left = x + 'px';
    el.style.top  = y + 'px';

    // Persist position
    if (!state.settings.decorPositions) state.settings.decorPositions = {};
    if (!state.settings.decorPositions[env]) state.settings.decorPositions[env] = {};
    state.settings.decorPositions[env][key] = { x, y };

    const envDecorEl = document.getElementById('envDecor');
    if (envDecorEl) envDecorEl.style.zIndex = '';

    decorDrag = null;
    saveState();
  }
}

// ===================================================
// PAGE MANAGEMENT
// ===================================================

function goToPage(index) {
  const pages = getPages();
  if (index < 0 || index >= pages.length) return;
  setCurrentPage(index);
  renderPage();
  saveState();
}

function addPage() {
  const pages = getPages();
  pages.push({ id: pages.length, notes: [] });
  setCurrentPage(pages.length - 1);
  renderPage();
  saveState();
}

// ===================================================
// QUICK ENTRY (bullet / number / checkbox)
// ===================================================

function handleNoteAction(action, textarea, noteData) {
  const start = textarea.selectionStart;
  const end   = textarea.selectionEnd;
  const val   = textarea.value;

  const beforeCursor = val.substring(0, start);
  const afterCursor  = val.substring(end);

  // Detect whether we're already at the start of an empty line
  const lastNL      = beforeCursor.lastIndexOf('\n');
  const currentLine = beforeCursor.substring(lastNL + 1);
  const atEmpty     = currentLine.trim() === '';

  let prefix = '';
  if (action === 'bullet') {
    prefix = '• ';
  } else if (action === 'number') {
    // Auto-increment from the last numbered line visible before cursor
    let lastNum = 0;
    beforeCursor.split('\n').forEach(line => {
      const m = line.match(/^(\d+)\./);
      if (m) lastNum = parseInt(m[1], 10);
    });
    prefix = `${lastNum + 1}. `;
  } else if (action === 'checkbox') {
    prefix = '☐ ';
  }

  const insert   = atEmpty ? prefix : '\n' + prefix;
  const newVal   = beforeCursor + insert + afterCursor;
  const newCursor = start + insert.length;

  textarea.value = newVal;
  textarea.selectionStart = textarea.selectionEnd = newCursor;
  textarea.focus();

  noteData.content = newVal;
  saveState();
}

// ===================================================
// SETTINGS CHANGES
// ===================================================

function changeFontSize(size) {
  state.settings.fontSize = size;
  applySettings();
  updateFontSizeUI();
  saveState();
}

function changeColorTheme(theme) {
  state.settings.colorTheme = theme;
  applySettings();

  // Re-tint all existing notes to new theme
  const page = getPages()[getCurrentPage()];
  if (page) {
    page.notes.forEach(n => {
      const el = document.getElementById(n.id);
      if (el) el.style.backgroundColor = noteColor(n);
    });
  }

  saveState();
}

function changeTextColor(color) {
  state.settings.textColor = color;
  applySettings();
  updateTextColorUI();

  // Update live text color on all note textareas
  const c = color === 'white' ? '#ffffff' : '#1a1a1a';
  document.querySelectorAll('.note-content').forEach(ta => {
    ta.style.color = c;
  });

  saveState();
}

function changeEnvironment(env) {
  state.settings.environment = env;
  applySettings(); // calls renderDecor() + updateDeskTitle()
  renderPage();    // show this environment's own notes
  saveState();
}

function changeLayoutMode(mode) {
  const prev = state.settings.layoutMode;
  if (prev === mode) return;

  state.settings.layoutMode = mode;

  if (prev === 'free' && mode === 'grid') {
    // Snap all current page notes to nearest grid cell
    const page = getPages()[getCurrentPage()];
    if (page) {
      page.notes.forEach(n => {
        const snapped = snapToGrid(n.x, n.y);
        n.x = snapped.x;
        n.y = snapped.y;
        n.rotation = 0;
      });
    }
  }

  applySettings();
  renderPage();
  saveState();
}

// ===================================================
// SETTINGS PANEL OPEN/CLOSE
// ===================================================

function openSettings() {
  if (settingsPanel)  settingsPanel.classList.add('open');
  if (settingsOverlay) settingsOverlay.classList.add('show');
}

function closeSettings() {
  if (settingsPanel)  settingsPanel.classList.remove('open');
  if (settingsOverlay) settingsOverlay.classList.remove('show');
}

// ===================================================
// PERSISTENCE
// ===================================================

function saveState() {
  try {
    localStorage.setItem('stickydesk-v1', JSON.stringify(state));
  } catch (_) { /* quota */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem('stickydesk-v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.settings) return null;
    // Migrate old single-pages format → per-environment format
    if (Array.isArray(parsed.pages) && !parsed.envPages) {
      const env = parsed.settings.environment || 'student';
      parsed.envPages       = { [env]: parsed.pages };
      parsed.envCurrentPage = { [env]: parsed.currentPage || 0 };
      delete parsed.pages;
      delete parsed.currentPage;
    }
    if (!parsed.envPages) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

// ===================================================
// EVENT BINDING
// ===================================================

// Null-safe addEventListener helper — if the element doesn't exist for any reason,
// skip it instead of throwing a TypeError that stops all subsequent bindings.
function on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

function bindEvents() {
  // Toolbar
  on('addNoteBtn',  'click', addNote);
  on('settingsBtn', 'click', openSettings);

  // Settings panel
  on('closeSettings', 'click', closeSettings);
  if (settingsOverlay) settingsOverlay.addEventListener('click', closeSettings);

  // Color theme
  document.querySelectorAll('[name="colorTheme"]').forEach(radio => {
    radio.addEventListener('change', () => {
      changeColorTheme(radio.value);
      refreshAllCards();
    });
  });

  // Text color
  on('textColorBlack', 'click', () => changeTextColor('black'));
  on('textColorWhite', 'click', () => changeTextColor('white'));

  // Font size
  ['small', 'medium', 'large'].forEach(sz => {
    on('size' + sz.charAt(0).toUpperCase() + sz.slice(1), 'click', () => changeFontSize(sz));
  });

  // Environment
  document.querySelectorAll('[name="environment"]').forEach(radio => {
    radio.addEventListener('change', () => {
      changeEnvironment(radio.value);
      refreshAllCards();
    });
  });

  // Layout mode
  document.querySelectorAll('[name="layoutMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      changeLayoutMode(radio.value);
      refreshAllCards();
    });
  });

  // Clear page
  on('clearPageBtn', 'click', clearCurrentPage);

  // Page navigation
  on('prevPage', 'click', () => goToPage(getCurrentPage() - 1));
  on('nextPage', 'click', () => goToPage(getCurrentPage() + 1));
  on('addPage',  'click', addPage);

  // Global drag handlers — mouse
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
  // Global drag handlers — touch
  document.addEventListener('touchmove', e => {
    // Active drag: suppress scroll and move the element
    if (drag || decorDrag) {
      e.preventDefault();
      onMouseMove(normalizePointer(e));
      return;
    }
    // Pending touch: start drag only once finger has moved far enough
    if (touchPending && e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchPending.startX;
      const dy = e.touches[0].clientY - touchPending.startY;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        e.preventDefault();
        const { el, noteData } = touchPending;
        touchPending = null;
        startDrag(normalizePointer(e), el, noteData);
      }
    }
  }, { passive: false });
  document.addEventListener('touchend', e => {
    touchPending = null;   // tap ended without becoming a drag — click fires normally
    onMouseUp(normalizePointer(e));
  });

  // Rebuild grid on resize
  window.addEventListener('resize', () => {
    buildGridOverlay();
    // Clamp notes inside new desk bounds
    const page = getPages()[getCurrentPage()];
    if (!page) return;
    const deskW = deskSurface.clientWidth;
    const deskH = deskSurface.clientHeight;
    page.notes.forEach(n => {
      const el = document.getElementById(n.id);
      if (!el) return;
      n.x = Math.max(0, Math.min(deskW - NOTE_W, n.x));
      n.y = Math.max(0, Math.min(deskH - NOTE_H, n.y));
      el.style.left = n.x + 'px';
      el.style.top  = n.y + 'px';
    });
  });

  // Keyboard shortcut: N = new note
  document.addEventListener('keydown', e => {
    if ((e.key === 'n' || e.key === 'N') &&
        !e.ctrlKey && !e.metaKey &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'INPUT') {
      addNote();
    }
    // Escape closes settings
    if (e.key === 'Escape') closeSettings();
  });
}

// ===================================================
// START
// ===================================================

// DOMContentLoaded may have already fired by the time this module loads
// (e.g. on mobile over a network where module fetch latency is non-trivial).
// Guard against that by checking readyState first.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
