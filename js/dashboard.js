/**
 * dashboard.js — P3
 * Greeting + live clock, 4 stat cards, Pipeline Overview, Recent Clients (top 5).
 */

const STATUS_ORDER = ['Lead', 'Contacted', 'Won', 'Lost'];
const STATUS_COLOR_VAR = {
  Lead: 'var(--peach)',
  Contacted: 'var(--sky)',
  Won: 'var(--mint)',
  Lost: 'var(--rose)',
};
const STATUS_LABEL_KEY = {
  Lead: 'status.lead',
  Contacted: 'status.contacted',
  Won: 'status.won',
  Lost: 'status.lost',
};

let dashboardClients = [];

function renderGreeting() {
  const session = getSession();
  const users = getUsers();
  const me = users.find((u) => u.id === session.userId);
  const firstName = me ? me.fullName.split(' ')[0] : null;
  document.getElementById('greeting').textContent = firstName
    ? t('dashboard.greeting', { name: firstName })
    : t('dashboard.greetingDefault');
}

function tickClock() {
  const now = new Date();
  const locale = getLang() === 'ka' ? 'ka-GE' : 'en-US';
  document.getElementById('clock-time').textContent = now.toLocaleTimeString(locale);
  document.getElementById('clock-date').textContent = formatLongDate(now);
}

function renderStats(clients) {
  const total = clients.length;
  const active = clients.filter((c) => c.status !== 'Won' && c.status !== 'Lost').length;
  const wonRevenue = clients
    .filter((c) => c.status === 'Won')
    .reduce((sum, c) => sum + c.dealValue, 0);
  const newThisWeek = clients.filter(
    (c) => (Date.now() - new Date(c.createdAt)) / 86400000 <= 7
  ).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-revenue').textContent = formatCurrency(wonRevenue);
  document.getElementById('stat-new').textContent = newThisWeek;
}