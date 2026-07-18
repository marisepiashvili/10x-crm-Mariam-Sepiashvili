
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