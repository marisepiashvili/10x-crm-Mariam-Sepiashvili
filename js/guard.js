
const STORAGE_KEYS = {
    users: 'crm_users', 
    session: 'crm_session', 
    clients: 'crm_clients', 
    theme: 'crm_theme'
};

const PROTECTED_PAGES = ['dashboard.html', 'clients.html', 'profile.html'];
const PUBLIC_PAGES = ['index.html', ""];

function getCurrentPage(){
    const path = window.location.pathname.split('/').pop();
    return path || 'index.html'
};

function getSession(){
    try{
        const raw = localStorage.getItem(STORAGE_KEYS.session);
        return raw ? JSON.parse(raw) : null;
    }catch{
        return null
    }
};

function runAuthGuard(){
    const page = getCurrentPage();
    const session = getSession();
    if(PROTECTED_PAGES.includes(page) && !session){
        window.location.href = 'index.html'; return;
    }
    if(PUBLIC_PAGES.includes(page) && session){
        window.location.href = 'dashboard.html'
    }
};
runAuthGuard();

const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.querySelector('[data-theme-toggle]');
    if(btn) {
        const isDark = theme === 'dark';
        btn.dataset.state = isDark ? 'on' : 'off';
        btn.setAttribute('aria-checked', String(isDark));
        const label = isDark ? t('theme.dard'):t('theme.light');
        btn.tittle = label;
        btn.setAttribute('aria-label', t('sidebar.theme') + ': ' + lable)
    }

}

function initTheme(){
    const saved = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    applyTheme(saved);
}
initTheme();

let themeSwitchTimer = null;
function toggleTheme(){
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.theme, next);
    clearTimeout(themeSwitchTimer);
    document.documentElement.classList.add('theme-switching');
    applyTheme(next);
    themeSwitchTimer = setTimeout(() => {
        document.documentElement.classList.remove('theme-switching');
    }, 320);
}

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
    'dashboard.html' : 'nav.dashboard', 
    'clients.html' : 'nav.clients',
    'profile.html' : 'nav.profile'
};

function toggleLang(){
    const next = getLang() === 'ka' ? 'en' : 'ka';
    setLang(next);
    refreshSidebarLabels();
    applyLangIcon();
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light') 
}

function setFieldError(fieldId, message){
    const wrap = document.getElementById(fieldId + '-field');
    const err = document.getElementById(fieldId + '-error');
    if(!wrap || !err) return;
    if(message){
        wrap.classList.add('input-error'); 
        err.textContent = message;
    } else{
        wrap.classList.remove('input-error'); 
        err.textContent = '';
    }
}

function showToast(message, type = 'success'){
    let stack = document.querySelector('.toast-stack');
    if(!stack) {
        stack = document.createElement('div'); 
        stack.className = 'toast-stack'; 
        document.body.appendChild(stack);
    }
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' err' : '');
    toast.textContent = message;
    stak.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

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

  return '' +
    '<a class="brand" href="dashboard.html"><span class="stamp">10X</span> 10X CRM</a>' +
    '<nav class="nav-links">' + linksHtml + '</nav>' +
    '<div class="sidebar-footer">' +
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

document.addEventListener('DOMContentLoaded', () => {
  if (PROTECTED_PAGES.includes(getCurrentPage())) {
    wireAppShell();
  } else {
    wireThemeLangToggles();
  }
});

