/**
 * i18n.js
 * English/Georgian translation dictionary + apply/switch helpers.
 * Language choice persists in crm_lang (localStorage) and applies on every page.
 * Static markup opts in via data-i18n="key" / data-i18n-placeholder="key".
 * Dynamically-rendered strings call t('key', { var: value }) directly.
 */

const I18N_STORAGE_KEY = 'crm_lang';

const TRANSLATIONS = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.profile': 'Profile',
    'sidebar.theme': 'Theme',
    'sidebar.language': 'Language',
    'sidebar.logout': 'Log out',
    'theme.dark': 'Dark',
    'theme.light': 'Light',

    'login.title': 'Welcome back',
    'login.subtitle': "Log in to see today's pipeline.",
    'login.submit': 'Log In',
    'login.switchText': "Don't have an account?",
    'login.switchLink': 'Sign up',
    'login.error.invalid': 'Invalid email or password',
    'login.error.emailRequired': 'Email is required',
    'login.error.passwordRequired': 'Password is required',

    'signup.title': 'Create your account',
    'signup.subtitle': 'Set up your pipeline in under a minute.',
    'signup.submit': 'Create Account',
    'signup.switchText': 'Already have an account?',
    'signup.switchLink': 'Log in',
    'signup.success': 'Account created successfully! Please log in.',

    'field.fullName': 'Full Name',
    'field.email': 'Email',
    'field.company': 'Company',
    'field.companyPlaceholder': 'Company (optional)',
    'field.password': 'Password',
    'field.confirmPassword': 'Confirm Password',
    'field.name': 'Name',
    'field.clientEmail': 'Email',
    'field.phone': 'Phone',
    'field.dealValue': 'Deal Value',
    'field.dealValuePlaceholder': 'e.g. 5000',
    'field.status': 'Status',
    'field.currentPassword': 'Current Password',
    'field.newPassword': 'New Password',
    'field.confirmNewPassword': 'Confirm New Password',

    'error.fullNameShort': 'Full name must be at least 3 characters',
    'error.emailInvalid': 'Please enter a valid email address',
    'error.emailExists': 'An account with this email already exists',
    'error.passwordWeak': 'Password must be at least 8 characters and contain a letter and a number',
    'error.passwordMismatch': 'Passwords do not match',

    'dashboard.greeting': 'Welcome back, {{name}}!',
    'dashboard.greetingDefault': 'Welcome back!',
    'dashboard.subtitle': "Here's where the pipeline stands right now.",
    'stat.totalClients': 'Total Clients',
    'stat.activeDeals': 'Active Deals',
    'stat.wonRevenue': 'Won Revenue',
    'stat.newThisWeek': 'New This Week',
    'card.pipelineOverview': 'Pipeline Overview',
    'card.recentClients': 'Recent Clients',
    'link.viewAllClients': 'View all clients →',
    'toast.dashboardLoadError': 'Could not load dashboard data.',
    'pipeline.total': 'Total',
    'pipeline.winRate': 'Win Rate',

    'status.lead': 'Lead',
    'status.contacted': 'Contacted',
    'status.won': 'Won',
    'status.lost': 'Lost',

    'clients.title': 'Clients',
    'clients.subtitle': 'Every lead and deal in one ledger.',
    'btn.addClient': '+ Add Client',
    'search.placeholder': 'Search by name or company...',
    'search.searching': 'Searching…',
    'chip.all': 'All',
    'sort.newest': 'Newest first',
    'sort.name': 'Name A → Z',
    'sort.value': 'Deal value: high → low',
    'state.loadingClients': 'Loading clients...',
    'state.loadError': 'Could not load clients. Check your connection and try again.',
    'btn.retry': 'Retry',
    'state.noClientsFound': 'No clients found.',
    'state.noClientsYet': 'No clients yet.',
    'modal.addClient.title': 'Add Client',
    'btn.addClientSubmit': 'Add Client',
    'modal.clientDetails.title': 'Client Details',
    'detail.clientSince': 'Client since {{date}}',
    'detail.company': 'Company',
    'detail.status': 'Status',
    'detail.email': 'Email',
    'detail.phone': 'Phone',
    'detail.dealValue': 'Deal Value',
    'notes.title': 'Notes',
    'notes.empty': 'No notes yet.',
    'notes.placeholder': 'Write a note...',
    'btn.addNote': '+ Add note',
    'btn.remindMe': 'Remind me in 1 min',
    'btn.startCall': 'Start Call',
    'btn.endCall': 'End Call',
    'note.callDuration': 'Call duration: {{duration}}',
    'toast.reminderSet': 'Reminder set ✓',
    'toast.followUp': '⏰ Follow up: {{name}}',
    'toast.clientDeleted': 'Client deleted',
    'toast.clientAdded': 'Client added ✓',
    'toast.addClientError': 'Could not add client. Please try again.',
    'toast.searchError': 'Search failed. Check your connection.',
    'confirm.deleteClient': 'Delete this client? This cannot be undone.',
    'validation.nameShort': 'Name must be at least 3 characters',
    'validation.emailInvalid': 'Please enter a valid email address',
    'validation.emailExists': 'A client with this email already exists',
    'validation.phoneShort': 'Phone number looks too short',
    'validation.dealValueInvalid': 'Deal value must be a positive number',

    'view.grid': 'Grid',
    'view.kanban': 'Kanban',
    'btn.exportCsv': 'Export CSV',
    'btn.loadMore': 'Load More',
    'shortcuts.hint': '/ search · N new client · E export · Esc close',
    'easter.found': '🏺 You found the secret! Squishing all the clay...',

    'profile.title': 'Profile',
    'profile.subtitle': 'Your account details and data controls.',
    'card.editProfile': 'Edit Profile',
    'card.changePassword': 'Change Password',
    'card.data': 'Data',
    'btn.saveChanges': 'Save Changes',
    'btn.changePasswordSubmit': 'Change Password',
    'data.description': 'Reset the client ledger back to a fresh 30-client sample from the API. Your account and session stay untouched.',
    'btn.resetData': 'Reset CRM Data',
    'confirm.resetData': 'Reset all client data? This replaces your current list with a fresh sample and cannot be undone.',
    'toast.profileUpdated': 'Profile updated ✓',
    'toast.passwordChanged': 'Password changed ✓',
    'toast.dataReset': 'Client data reset ✓',
    'toast.dataResetError': 'Could not reset data. Check your connection.',
    'validation.currentPasswordWrong': 'Current password is incorrect',
    'validation.passwordSameAsOld': 'New password must be different from the current one',
    'profile.meta': '{{email}} · {{company}} · Member since {{date}}',
    'profile.noCompany': 'No company',
  },

  ka: {
    'nav.dashboard': 'დეშბორდი',
    'nav.clients': 'კლიენტები',
    'nav.profile': 'პროფილი',
    'sidebar.theme': 'თემა',
    'sidebar.language': 'ენა',
    'sidebar.logout': 'გასვლა',
    'theme.dark': 'მუქი',
    'theme.light': 'ღია',

    'login.title': 'კეთილი იყოს თქვენი დაბრუნება',
    'login.subtitle': 'შედით სისტემაში, რომ ნახოთ დღევანდელი პაიპლაინი.',
    'login.submit': 'შესვლა',
    'login.switchText': 'არ გაქვთ ანგარიში?',
    'login.switchLink': 'დარეგისტრირდით',
    'login.error.invalid': 'არასწორი ელფოსტა ან პაროლი',
    'login.error.emailRequired': 'ელფოსტა სავალდებულოა',
    'login.error.passwordRequired': 'პაროლი სავალდებულოა',

    'signup.title': 'შექმენით ანგარიში',
    'signup.subtitle': 'შექმენით თქვენი პაიპლაინი ერთ წუთში.',
    'signup.submit': 'ანგარიშის შექმნა',
    'signup.switchText': 'უკვე გაქვთ ანგარიში?',
    'signup.switchLink': 'შესვლა',
    'signup.success': 'ანგარიში წარმატებით შეიქმნა! გთხოვთ, შეხვიდეთ სისტემაში.',

    'field.fullName': 'სრული სახელი',
    'field.email': 'ელფოსტა',
    'field.company': 'კომპანია',
    'field.companyPlaceholder': 'კომპანია (არასავალდებულო)',
    'field.password': 'პაროლი',
    'field.confirmPassword': 'დაადასტურეთ პაროლი',
    'field.name': 'სახელი',
    'field.clientEmail': 'ელფოსტა',
    'field.phone': 'ტელეფონი',
    'field.dealValue': 'გარიგების ღირებულება',
    'field.dealValuePlaceholder': 'მაგ. 5000',
    'field.status': 'სტატუსი',
    'field.currentPassword': 'მიმდინარე პაროლი',
    'field.newPassword': 'ახალი პაროლი',
    'field.confirmNewPassword': 'დაადასტურეთ ახალი პაროლი',

    'error.fullNameShort': 'სრული სახელი უნდა შეიცავდეს მინიმუმ 3 სიმბოლოს',
    'error.emailInvalid': 'გთხოვთ, შეიყვანოთ სწორი ელფოსტის მისამართი',
    'error.emailExists': 'ამ ელფოსტით ანგარიში უკვე არსებობს',
    'error.passwordWeak': 'პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს, ასოსა და ციფრს',
    'error.passwordMismatch': 'პაროლები არ ემთხვევა',

    'dashboard.greeting': 'კეთილი იყოს შენი დაბრუნება, {{name}}!',
    'dashboard.greetingDefault': 'კეთილი იყოს დაბრუნება!',
    'dashboard.subtitle': 'აი, როგორ გამოიყურება პაიფლაინი ახლა.',
    'stat.totalClients': 'კლიენტების რაოდენობა',
    'stat.activeDeals': 'აქტიური გარიგებები',
    'stat.wonRevenue': 'მოგებული შემოსავალი',
    'stat.newThisWeek': 'ახალი ამ კვირაში',
    'card.pipelineOverview': 'პაიფლაინის მიმოხილვა',
    'card.recentClients': 'ბოლო კლიენტები',
    'link.viewAllClients': 'ყველა კლიენტის ნახვა →',
    'toast.dashboardLoadError': 'დაფის მონაცემების ჩატვირთვა ვერ მოხერხდა.',
    'pipeline.total': 'სულ',
    'pipeline.winRate': 'მოგების მაჩვენებელი',

    'status.lead': 'ლიდი',
    'status.contacted': 'დაკავშირებული',
    'status.won': 'მოგებული',
    'status.lost': 'წაგებული',

    'clients.title': 'კლიენტები',
    'clients.subtitle': 'ყველა ლიდი და გარიგება ერთ ადგილას.',
    'btn.addClient': '+ კლიენტის დამატება',
    'search.placeholder': 'მოძებნეთ სახელით ან კომპანიით...',
    'search.searching': 'იძებნება…',
    'chip.all': 'ყველა',
    'sort.newest': 'ჯერ ახალი',
    'sort.name': 'სახელი A → Z',
    'sort.value': 'გარიგების ღირებულება: მაღალი → დაბალი',
    'state.loadingClients': 'იტვირთება კლიენტები...',
    'state.loadError': 'კლიენტების ჩატვირთვა ვერ მოხერხდა. შეამოწმეთ კავშირი და სცადეთ ხელახლა.',
    'btn.retry': 'ხელახლა ცდა',
    'state.noClientsFound': 'კლიენტები ვერ მოიძებნა.',
    'state.noClientsYet': 'ჯერ არცერთი კლიენტი არ არის.',
    'modal.addClient.title': 'კლიენტის დამატება',
    'btn.addClientSubmit': 'კლიენტის დამატება',
    'modal.clientDetails.title': 'კლიენტის დეტალები',
    'detail.clientSince': 'კლიენტია {{date}}-დან',
    'detail.company': 'კომპანია',
    'detail.status': 'სტატუსი',
    'detail.email': 'ელფოსტა',
    'detail.phone': 'ტელეფონი',
    'detail.dealValue': 'გარიგების ღირებულება',
    'notes.title': 'შენიშვნები',
    'notes.empty': 'შენიშვნები ჯერ არ არის.',
    'notes.placeholder': 'დაწერეთ შენიშვნა...',
    'btn.addNote': '+ შენიშვნის დამატება',
    'btn.remindMe': 'შემახსენე 1 წუთში',
    'btn.startCall': 'ზარის დაწყება',
    'btn.endCall': 'ზარის დასრულება',
    'note.callDuration': 'ზარის ხანგრძლივობა: {{duration}}',
    'toast.reminderSet': 'შეხსენება დაყენებულია ✓',
    'toast.followUp': '⏰ დაუკავშირდით: {{name}}',
    'toast.clientDeleted': 'კლიენტი წაიშალა',
    'toast.clientAdded': 'კლიენტი დაემატა ✓',
    'toast.addClientError': 'კლიენტის დამატება ვერ მოხერხდა. სცადეთ ხელახლა.',
    'toast.searchError': 'ძებნა ვერ მოხერხდა. შეამოწმეთ კავშირი.',
    'confirm.deleteClient': 'წავშალო ეს კლიენტი? ამის გაუქმება შეუძლებელია.',
    'validation.nameShort': 'სახელი უნდა შეიცავდეს მინიმუმ 3 სიმბოლოს',
    'validation.emailInvalid': 'გთხოვთ, შეიყვანოთ სწორი ელფოსტის მისამართი',
    'validation.emailExists': 'ამ ელფოსტით კლიენტი უკვე არსებობს',
    'validation.phoneShort': 'ტელეფონის ნომერი ძალიან მოკლეა',
    'validation.dealValueInvalid': 'გარიგების ღირებულება უნდა იყოს დადებითი რიცხვი',

    'view.grid': 'ბადე',
    'view.kanban': 'კანბანი',
    'btn.exportCsv': 'CSV ექსპორტი',
    'btn.loadMore': 'მეტის ჩატვირთვა',
    'shortcuts.hint': '/ ძებნა · N ახალი კლიენტი · E ექსპორტი · Esc დახურვა',
    'easter.found': '🏺 საიდუმლო აღმოაჩინე! მთელი თიხა იჭყლიტება...',

    'profile.title': 'პროფილი',
    'profile.subtitle': 'თქვენი ანგარიშის დეტალები და მონაცემების მართვა.',
    'card.editProfile': 'პროფილის რედაქტირება',
    'card.changePassword': 'პაროლის შეცვლა',
    'card.data': 'მონაცემები',
    'btn.saveChanges': 'ცვლილებების შენახვა',
    'btn.changePasswordSubmit': 'პაროლის შეცვლა',
    'data.description': 'დააბრუნეთ კლიენტების სია საწყის 30-კლიენტიან ნიმუშზე API-დან. თქვენი ანგარიში და სესია უცვლელი დარჩება.',
    'btn.resetData': 'CRM მონაცემების გადატვირთვა',
    'confirm.resetData': 'გადაიტვირთოს ყველა კლიენტის მონაცემი? ეს ჩაანაცვლებს მიმდინარე სიას ახალი ნიმუშით და ამის გაუქმება შეუძლებელია.',
    'toast.profileUpdated': 'პროფილი განახლდა ✓',
    'toast.passwordChanged': 'პაროლი შეიცვალა ✓',
    'toast.dataReset': 'კლიენტების მონაცემები განახლდა ✓',
    'toast.dataResetError': 'მონაცემების გადატვირთვა ვერ მოხერხდა. შეამოწმეთ კავშირი.',
    'validation.currentPasswordWrong': 'მიმდინარე პაროლი არასწორია',
    'validation.passwordSameAsOld': 'ახალი პაროლი უნდა განსხვავდებოდეს მიმდინარესგან',
    'profile.meta': '{{email}} · {{company}} · წევრია {{date}}-დან',
    'profile.noCompany': 'კომპანია არ არის მითითებული',
  },
};

const WEEKDAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ka: ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'],
};
const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
};

function formatLongDate(date) {
  const lang = getLang() === 'ka' ? 'ka' : 'en';
  const weekday = WEEKDAYS[lang][date.getDay()];
  const month = MONTHS[lang][date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return lang === 'ka' ? `${weekday}, ${day} ${month}, ${year}` : `${weekday}, ${month} ${day}, ${year}`;
}

function getLang() {
  return localStorage.getItem(I18N_STORAGE_KEY) || 'en';
}

function setLang(lang) {
  localStorage.setItem(I18N_STORAGE_KEY, lang);
  applyTranslations();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function t(key, vars) {
  const lang = getLang();
  let str = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(new RegExp('{{' + k + '}}', 'g'), vars[k]);
    });
  }
  return str;
}

function applyTranslations() {
  document.documentElement.setAttribute('lang', getLang() === 'ka' ? 'ka' : 'en');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
}

document.addEventListener('DOMContentLoaded', applyTranslations);
