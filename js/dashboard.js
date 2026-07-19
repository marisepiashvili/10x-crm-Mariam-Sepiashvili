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

function renderPipeline(clients) {
  const counts = { Lead: 0, Contacted: 0, Won: 0, Lost: 0 };
  clients.forEach((c) => { if (counts[c.status] !== undefined) counts[c.status]++; });
  const max = Math.max(1, clients.length);

  const container = document.getElementById('pipeline-overview');
  container.innerHTML = STATUS_ORDER.map((status) => {
    const count = counts[status];
    const pct = Math.round((count / max) * 100);
    return `
      <div class="pipeline-item">
        <span class="pname">${t(STATUS_LABEL_KEY[status])}</span>
        <span class="ptrack"><span class="pfill" style="width:${pct}%; background:${STATUS_COLOR_VAR[status]};"></span></span>
        <span class="pcount">${count}</span>
      </div>`;
  }).join('');

  renderPipelineDonut(counts, clients.length);
}