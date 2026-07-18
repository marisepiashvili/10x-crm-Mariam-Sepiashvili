
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
