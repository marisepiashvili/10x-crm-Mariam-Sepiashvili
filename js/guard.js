/**
 * guard.js
 * Shared, page-agnostic logic:
 *  - Auth Guard (P0.1): protects private pages, redirects logged-in users away from public pages
 *  - Navigation wiring + active link + logout (P0.2)
 *  - Theme toggle, persisted in crm_theme (P0.3)
 *  - Toast notification helper (P0.4)
 */

const STORAGE_KEYS = {
  users: 'crm_users',
  session: 'crm_session',
  clients: 'crm_clients',
  theme: 'crm_theme',
};

const PROTECTED_PAGES = ['dashboard.html', 'clients.html', 'profile.html'];
const PUBLIC_PAGES = ['index.html', ''];

function getCurrentPage() {
  const path = window.location.pathname.split('/').pop();
  return path || 'index.html';
}

function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function runAuthGuard() {
  const page = getCurrentPage();
  const session = getSession();

  if (PROTECTED_PAGES.includes(page) && !session) {
    window.location.href = 'index.html';
    return;
  }
  if (PUBLIC_PAGES.includes(page) && session) {
    window.location.href = 'dashboard.html';
  }
}

// Run the guard immediately (before paint) so protected content never flashes.
runAuthGuard();

/* ---------------- Icons ---------------- */

const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

/* ---------------- Theme ---------------- */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.querySelector('[data-theme-toggle]');
  if (btn) {
    const isDark = theme === 'dark';
    btn.dataset.state = isDark ? 'on' : 'off';
    btn.setAttribute('aria-checked', String(isDark));
    const label = isDark ? t('theme.dark') : t('theme.light');
    btn.title = label;
    btn.setAttribute('aria-label', t('sidebar.theme') + ': ' + label);
  }
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
  applyTheme(saved);
}

let themeSwitchTimer = null;

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEYS.theme, next);

  // Swapping --clay/--shadow custom properties would otherwise animate the
  // box-shadow/transform transitions on every card at once (expensive, all
  // inset shadows repainting simultaneously). While this class is present,
  // only the cheap color properties are allowed to transition, so the theme
  // still crossfades smoothly without the box-shadow jank.
  clearTimeout(themeSwitchTimer);
  document.documentElement.classList.add('theme-switching');
  applyTheme(next);
  themeSwitchTimer = setTimeout(() => {
    document.documentElement.classList.remove('theme-switching');
  }, 200);
}

initTheme();

/* ---------------- Language ---------------- */

function applyLangIcon() {
  const btn = document.querySelector('[data-lang-toggle]');
  if (btn) {
    const isKa = getLang() === 'ka';
    btn.dataset.state = isKa ? 'on' : 'off';
    btn.setAttribute('aria-checked', String(isKa));
    const label = isKa ? 'ქართული' : 'English';
    btn.title = label;
    btn.setAttribute('aria-label', t('sidebar.language') + ': ' + label);
  }
}

const NAV_LABEL_KEY = {
  'dashboard.html': 'nav.dashboard',
  'clients.html': 'nav.clients',
  'profile.html': 'nav.profile',
};

function refreshSidebarLabels() {
  document.querySelectorAll('.nav-link').forEach((a) => {
    const labelKey = NAV_LABEL_KEY[a.dataset.page];
    if (!labelKey) return;
    const dot = a.querySelector('.dot');
    a.textContent = t(labelKey);
    if (dot) a.prepend(dot);
  });
  const logoutBtn = document.querySelector('[data-logout]');
  if (logoutBtn) logoutBtn.textContent = t('sidebar.logout');
}

function toggleLang() {
  const next = getLang() === 'ka' ? 'en' : 'ka';
  setLang(next);
  refreshSidebarLabels();
  applyLangIcon();
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
}

/* ---------------- Shared form-field error helper ----------------
 * Used by every form on the site: signup, login, add-client, profile.
 * Expects markup: <div id="{id}-field" class="field"> ... <div id="{id}-error">
 */

function setFieldError(fieldId, message) {
  const wrap = document.getElementById(fieldId + '-field');
  const err = document.getElementById(fieldId + '-error');
  if (!wrap || !err) return;
  if (message) {
    wrap.classList.add('input-error');
    err.textContent = message;
  } else {
    wrap.classList.remove('input-error');
    err.textContent = '';
  }
}

/* ---------------- Toast ---------------- */

function showToast(message, type = 'success') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' err' : '');
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// A reminder firing later (possibly hours after the page that set it was
// left) deserves more visual weight than a routine bottom-right status
// toast, so it gets its own top-center stack -- and unlike the auto-dismiss
// toasts, it stays on screen until the user closes it, since an unattended
// reminder that vanished on its own would defeat the point.
function showTopToast(message) {
  let stack = document.querySelector('.toast-stack-top');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack-top';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = 'toast toast-top';

  const text = document.createElement('span');
  text.className = 'toast-top-text';
  text.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => toast.remove());

  toast.appendChild(text);
  toast.appendChild(closeBtn);
  stack.appendChild(toast);
}

/* ---------------- Easter egg: Konami code squishes every clay surface ---------------- */

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiProgress = 0;

function triggerClaySquish() {
  const surfaces = document.querySelectorAll('.card, .stat-card, .client-card, .kanban-card, .sidebar, .modal, .auth-card');
  surfaces.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('easter-squish');
      el.addEventListener('animationend', () => el.classList.remove('easter-squish'), { once: true });
    }, i * 40);
  });
  showToast(t('easter.found'));
}

document.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === KONAMI_CODE[konamiProgress]) {
    konamiProgress++;
    if (konamiProgress === KONAMI_CODE.length) {
      konamiProgress = 0;
      triggerClaySquish();
    }
  } else {
    konamiProgress = key === KONAMI_CODE[0] ? 1 : 0;
  }
});

/* ---------------- Hover FX: spotlight glow, card tilt, button ripple ----------------
 * One rAF-throttled pointermove handler drives both the cursor-follow
 * spotlight (--mx/--my, read by the ::before glow in styles.css) and the
 * card tilt (--tiltX/--tiltY, read by the perspective transform), so a
 * hover over a stat/client card never does more than one layout read
 * per animation frame.
 */

const SPOTLIGHT_SELECTOR = '.card, .stat-card, .client-card, .auth-card';
const TILT_SELECTOR = '.stat-card, .client-card';
const TILT_MAX_DEG = 6;

let hoverFxPending = null;
let hoverFxTicking = false;

function applyHoverFx() {
  hoverFxTicking = false;
  const e = hoverFxPending;
  if (!e) return;

  const spotlightEl = e.target.closest(SPOTLIGHT_SELECTOR);
  if (spotlightEl) {
    const rect = spotlightEl.getBoundingClientRect();
    spotlightEl.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
    spotlightEl.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
  }

  const tiltEl = e.target.closest(TILT_SELECTOR);
  if (tiltEl) {
    const rect = tiltEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    tiltEl.style.setProperty('--tiltX', (-py * TILT_MAX_DEG).toFixed(2) + 'deg');
    tiltEl.style.setProperty('--tiltY', (px * TILT_MAX_DEG).toFixed(2) + 'deg');
  }
}

document.addEventListener('mousemove', (e) => {
  hoverFxPending = e;
  if (!hoverFxTicking) {
    hoverFxTicking = true;
    requestAnimationFrame(applyHoverFx);
  }
});

// mouseleave doesn't bubble, but capture-phase listeners still see it as it
// passes through document on its way to the target -- no per-card listener needed.
document.addEventListener(
  'mouseleave',
  (e) => {
    if (e.target.matches && e.target.matches(TILT_SELECTOR)) {
      e.target.style.setProperty('--tiltX', '0deg');
      e.target.style.setProperty('--tiltY', '0deg');
    }
  },
  true
);

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.4;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = size + 'px';
  ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top = (e.clientY - rect.top) + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

/* ---------------- Nav wiring (called on protected pages) ----------------
 * The sidebar markup lives in ONE place (buildSidebar) so dashboard.html,
 * clients.html and profile.html never duplicate it -- each just provides
 * an empty <div id="sidebar-root"></div>.
 */

function buildSidebar(activePage) {
  const links = [
    { key: 'dashboard.html', label: t('nav.dashboard') },
    { key: 'clients.html', label: t('nav.clients') },
    { key: 'profile.html', label: t('nav.profile') },
  ];

  const linksHtml = links
    .map(
      (l) => '<a class="nav-link' + (l.key === activePage ? ' active' : '') +
        '" href="' + l.key + '" data-page="' + l.key + '"><span class="dot"></span>' + l.label + '</a>'
    )
    .join('');

  const user = getCurrentUser();
  const userCardHtml = user
    ? '<a class="sidebar-user" href="profile.html">' +
        '<span class="sidebar-user-avatar">' + escapeHtml(initials(user.fullName)) + '</span>' +
        '<span class="sidebar-user-info">' +
          '<span class="sidebar-user-name">' + escapeHtml(user.fullName) + '</span>' +
          '<span class="sidebar-user-email">' + escapeHtml(user.email) + '</span>' +
        '</span>' +
      '</a>'
    : '';

  return '' +
    '<a class="brand" href="dashboard.html"><span class="stamp">10X</span> 10X CRM</a>' +
    '<nav class="nav-links">' + linksHtml + '</nav>' +
    '<div class="sidebar-footer">' +
      userCardHtml +
      '<div class="switch-row">' +
        '<button class="switch-toggle" data-theme-toggle type="button" role="switch">' +
          '<span class="switch-track">' +
            '<span class="switch-icon switch-icon-left">' + ICON_SUN + '</span>' +
            '<span class="switch-icon switch-icon-right">' + ICON_MOON + '</span>' +
            '<span class="switch-knob"></span>' +
          '</span>' +
        '</button>' +
        '<button class="switch-toggle" data-lang-toggle type="button" role="switch">' +
          '<span class="switch-track">' +
            '<span class="switch-icon switch-icon-left switch-text">EN</span>' +
            '<span class="switch-icon switch-icon-right switch-text">ქა</span>' +
            '<span class="switch-knob"></span>' +
          '</span>' +
        '</button>' +
      '</div>' +
      '<button class="logout-btn" data-logout type="button">' + t('sidebar.logout') + '</button>' +
    '</div>';
}

function wireThemeLangToggles() {
  applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'light');
  applyLangIcon();

  const themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const langBtn = document.querySelector('[data-lang-toggle]');
  if (langBtn) langBtn.addEventListener('click', toggleLang);
}

function wireAppShell() {
  const page = getCurrentPage();

  const root = document.getElementById('sidebar-root');
  if (root) {
    root.innerHTML = buildSidebar(page);
  }

  wireThemeLangToggles();

  const logoutBtn = document.querySelector('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.session);
      window.location.href = 'index.html';
    });
  }
}

/* ---------------- User store helpers (shared by auth.js / profile.js) ---------------- */

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.users);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find((u) => u.id === session.userId) || null;
}

function initials(fullName) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

/* ---------------- Call-note helpers (shared by clients.js / dashboard.js) ----------------
 * Call notes are auto-generated ("Call duration: 05:23") rather than typed by
 * the user, so their display text should always render in whatever language
 * is active now -- not get frozen in the language that was active the moment
 * the call ended. Notes created before the `type` field existed also have no
 * other way to be told apart from a manual note, so both checks fall back to
 * matching either language's "Call duration: ..." template against the text.
 */

const CALL_NOTE_PREFIXES = ['en', 'ka'].map((lang) => TRANSLATIONS[lang]['note.callDuration'].split('{{duration}}')[0]);

function isCallNote(n) {
  if (n.type === 'call') return true;
  if (n.type) return false;
  return CALL_NOTE_PREFIXES.some((prefix) => n.text.startsWith(prefix));
}

function extractCallDuration(n) {
  if (n.duration) return n.duration;
  for (const prefix of CALL_NOTE_PREFIXES) {
    if (n.text.startsWith(prefix)) return n.text.slice(prefix.length).trim();
  }
  return null;
}

function getNoteDisplayText(n) {
  if (!isCallNote(n)) return n.text;
  const duration = extractCallDuration(n);
  return duration ? t('note.callDuration', { duration }) : n.text;
}

/* ---------------- Free-text translation (MyMemory API) ----------------
 * Manually-typed notes have arbitrary words, so unlike the templated call
 * notes above there's no local dictionary trick -- the only way to show
 * them in a different language is a real machine-translation call.
 * MyMemory's public endpoint needs no API key and allows CORS from the
 * browser, matching this app's no-backend setup (same reasoning as the
 * DummyJSON call in data.js). Each note is tagged with the language it was
 * typed in (see addNote in clients.js); untagged legacy notes are left as-is
 * since we have no reliable way to know what language they started in.
 */

const TRANSLATE_API = 'https://api.mymemory.translated.net/get';
const translationCache = new Map();

async function translateText(text, sourceLang, targetLang) {
  if (!text || !sourceLang || sourceLang === targetLang) return text;

  const cacheKey = sourceLang + '|' + targetLang + '|' + text;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  try {
    const url = TRANSLATE_API + '?q=' + encodeURIComponent(text) + '&langpair=' + sourceLang + '|' + targetLang;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Translation request failed');
    const data = await response.json();
    const translated = data && data.responseData && data.responseData.translatedText;
    const result = translated || text;
    translationCache.set(cacheKey, result);
    return result;
  } catch {
    return text;
  }
}

async function getTranslatedNoteText(n) {
  const displayText = getNoteDisplayText(n);
  if (isCallNote(n)) return displayText;
  if (!n.lang || n.lang === getLang()) return displayText;
  return translateText(displayText, n.lang, getLang());
}

/* ---------------- Note mutation helpers (shared by clients.js / dashboard.js) ----------------
 * clients.html and dashboard.html each keep their own loaded copy of the
 * clients array (allClients / dashboardClients), but a note lives inside a
 * client object regardless of which page is holding it, so these just need
 * that page's array passed in to persist the change back to localStorage.
 */

function deleteClientNote(clients, client, note) {
  const idx = client.notes.indexOf(note);
  if (idx === -1) return;
  client.notes.splice(idx, 1);
  saveClients(clients);
}

function toggleNoteImportant(clients, note) {
  note.important = !note.important;
  saveClients(clients);
}

document.addEventListener('DOMContentLoaded', () => {
  if (PROTECTED_PAGES.includes(getCurrentPage())) {
    wireAppShell();
  } else {
    wireThemeLangToggles();
  }
});
