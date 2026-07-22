/**
 * dashboard.js — P3
 * Greeting + live clock, 4 stat cards, Pipeline Overview, Recent Clients (top 5).
 */

const STATUS_COLOR_VAR = {
  Lead: 'var(--peach)',
  Contacted: 'var(--sky)',
  Won: 'var(--mint)',
  Lost: 'var(--rose)',
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

const DONUT_R = 50;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;
const DONUT_GAP = 3;

function renderPipelineDonut(counts, total) {
  const el = document.getElementById('pipeline-donut');
  if (!el) return;

  if (total === 0) {
    const emptyLegend = STATUS_ORDER.map((status) => `
      <li class="legend-item">
        <span class="legend-dot" style="background:${STATUS_COLOR_VAR[status]};"></span>
        <span class="legend-label">${t(STATUS_LABEL_KEY[status])}</span>
        <span class="legend-pct">—</span>
      </li>`).join('');

    el.innerHTML = `
      <div class="donut-wrap">
        <svg class="donut-chart" viewBox="0 0 120 120" width="128" height="128" role="img" aria-label="${t('card.pipelineOverview')}">
          <circle class="donut-track" cx="60" cy="60" r="${DONUT_R}" stroke-width="14" fill="none" />
        </svg>
        <div class="donut-center">
          <span class="donut-total">0</span>
          <span class="donut-total-label">${t('pipeline.total')}</span>
        </div>
      </div>
      <div class="donut-side">
        <ul class="donut-legend">${emptyLegend}</ul>
        <div class="win-rate">
          <span class="win-rate-value">—</span>
          <span class="win-rate-label">${t('pipeline.winRate')}</span>
        </div>
      </div>`;
    return;
  }

  const pctByStatus = {};
  STATUS_ORDER.forEach((status) => {
    pctByStatus[status] = Math.round((counts[status] / total) * 100);
  });

  let cumulative = 0;
  const segments = STATUS_ORDER.map((status) => {
    const count = counts[status];
    if (count === 0) return '';
    const frac = count / total;
    const arcLen = frac * DONUT_CIRC;
    const dash = Math.max(arcLen - DONUT_GAP, 0.001);
    const circle = `<circle class="donut-seg" cx="60" cy="60" r="${DONUT_R}" stroke="${STATUS_COLOR_VAR[status]}" stroke-width="14" fill="none" stroke-dasharray="${dash} ${DONUT_CIRC - dash}" stroke-dashoffset="${-cumulative}"><title>${t(STATUS_LABEL_KEY[status])}: ${count} (${pctByStatus[status]}%)</title></circle>`;
    cumulative += arcLen;
    return circle;
  }).join('');

  const legend = STATUS_ORDER.map((status) => `
    <li class="legend-item">
      <span class="legend-dot" style="background:${STATUS_COLOR_VAR[status]};"></span>
      <span class="legend-label">${t(STATUS_LABEL_KEY[status])}</span>
      <span class="legend-pct">${pctByStatus[status]}%</span>
    </li>`).join('');

  const wonLostTotal = counts.Won + counts.Lost;
  const winRate = wonLostTotal > 0 ? Math.round((counts.Won / wonLostTotal) * 100) + '%' : '—';

  el.innerHTML = `
    <div class="donut-wrap">
      <svg class="donut-chart" viewBox="0 0 120 120" width="128" height="128" role="img" aria-label="${t('card.pipelineOverview')}">
        <circle class="donut-track" cx="60" cy="60" r="${DONUT_R}" stroke-width="14" fill="none" />
        <g class="donut-segs">${segments}</g>
      </svg>
      <div class="donut-center">
        <span class="donut-total">${total}</span>
        <span class="donut-total-label">${t('pipeline.total')}</span>
      </div>
    </div>
    <div class="donut-side">
      <ul class="donut-legend">${legend}</ul>
      <div class="win-rate">
        <span class="win-rate-value">${winRate}</span>
        <span class="win-rate-label">${t('pipeline.winRate')}</span>
      </div>
    </div>`;
}

function renderRecent(clients) {
  const recent = clients
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const container = document.getElementById('recent-clients');
  if (recent.length === 0) {
    container.innerHTML = `<p class="state-msg">${t('state.noClientsYet')}</p>`;
    return;
  }

  container.innerHTML = recent.map((c) => `
    <div class="recent-row client-row" data-id="${c.id}">
      <img class="avatar" src="${c.image}" alt="">
      <div class="who">
        <div class="n">${escapeHtml(c.name)}</div>
        <div class="c">${escapeHtml(c.company || '—')}</div>
      </div>
      <span class="badge st-${c.status.toLowerCase()}">${t(STATUS_LABEL_KEY[c.status])}</span>
      <span class="date">${new Date(c.createdAt).toLocaleDateString()}</span>
    </div>
  `).join('');

  wireClientRowClicks(container);
}

function renderTopDeals(clients) {
  const container = document.getElementById('top-deals');
  if (!container) return;

  const top = clients
    .filter((c) => c.status === 'Won')
    .sort((a, b) => b.dealValue - a.dealValue)
    .slice(0, 10);

  if (top.length === 0) {
    container.innerHTML = `<p class="state-msg">${t('state.noClientsYet')}</p>`;
    return;
  }

  container.innerHTML = top.map((c, i) => `
    <div class="recent-row client-row" data-id="${c.id}">
      <span class="rank-badge rank-${i + 1}">${i + 1}</span>
      <img class="avatar" src="${c.image}" alt="">
      <div class="who">
        <div class="n">${escapeHtml(c.name)}</div>
        <div class="c">${escapeHtml(c.company || '—')}</div>
        <div class="deal-age">${t('detail.clientSince', { date: new Date(c.createdAt).toLocaleDateString() })}</div>
      </div>
      <span class="amount">${formatCurrency(c.dealValue)}</span>
    </div>
  `).join('');

  wireClientRowClicks(container);
}

function wireClientRowClicks(container) {
  container.querySelectorAll('.client-row').forEach((row) => {
    row.addEventListener('click', () => openClientDetail(row.dataset.id));
  });
}

function refreshDashboardViews() {
  renderStats(dashboardClients);
  renderPipeline(dashboardClients);
  renderRecent(dashboardClients);
  renderTopDeals(dashboardClients);
  renderActivity(dashboardClients);
}

function openClientDetail(id) {
  openDetailModal(id, dashboardClients, {
    onEdit: (client) => { window.location.href = 'clients.html?edit=' + client.id; },
    onChange: refreshDashboardViews,
  });
}

async function renderActivityList(container, items, emptyMessage, iconClass, iconGlyph, useBubble) {
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<p class="state-msg">${emptyMessage}</p>`;
    return;
  }
  // Only the (up to 5) rows actually being rendered get translated, not
  // every note/call across every client -- keeps this to a handful of
  // network calls at most, and translateText() caches repeats anyway.
  const rows = await Promise.all(items.map(async ({ note, date, client }) => {
    const text = await getTranslatedNoteText(note);
    const important = useBubble && note.important;
    return `
      <div class="recent-row${important ? ' is-important' : ''}">
        <span class="activity-icon ${iconClass}">${iconGlyph}</span>
        <div class="who">
          ${useBubble
            ? `<div class="c">${important ? '⭐ ' : ''}${escapeHtml(client.name)}</div><div class="note-bubble">${escapeHtml(text)}</div>`
            : `<div class="n">${escapeHtml(client.name)}</div><div class="c">${escapeHtml(text)}</div>`}
        </div>
        <span class="date">${escapeHtml(date)}</span>
        <div class="note-actions">
          ${useBubble ? `<button class="note-star-btn${important ? ' active' : ''}" type="button" title="${t('btn.markImportant')}">★</button>` : ''}
          <button class="note-delete-btn" type="button" title="${t('btn.deleteNote')}">&times;</button>
        </div>
      </div>`;
  }));
  container.innerHTML = rows.join('');

  if (useBubble) {
    container.querySelectorAll('.note-star-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        toggleNoteImportant(dashboardClients, items[i].note);
        renderActivity(dashboardClients);
      });
    });
  }
  container.querySelectorAll('.note-delete-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      deleteClientNote(dashboardClients, items[i].client, items[i].note);
      renderActivity(dashboardClients);
    });
  });
}

async function renderActivity(clients) {
  const notes = [];
  const calls = [];

  clients.forEach((c) => {
    (c.notes || []).forEach((n) => {
      const item = { note: n, date: n.date, client: c };
      (isCallNote(n) ? calls : notes).push(item);
    });
  });

  notes.sort((a, b) => {
    const importantDiff = (b.note.important ? 1 : 0) - (a.note.important ? 1 : 0);
    return importantDiff !== 0 ? importantDiff : new Date(b.date) - new Date(a.date);
  });
  calls.sort((a, b) => new Date(b.date) - new Date(a.date));

  await renderActivityList(document.getElementById('activity-notes'), notes.slice(0, 20), t('notes.empty'), 'activity-icon-note', '📝', true);
  await renderActivityList(document.getElementById('activity-calls'), calls.slice(0, 20), t('state.noCallsYet'), 'activity-icon-call', '📞', false);
}

function wireActivityTabs() {
  const tabs = document.querySelectorAll('#activity-tabs .chip');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.tabPanel !== tab.dataset.tab);
      });
    });
  });
}

async function initDashboard() {
  renderGreeting();
  tickClock();
  setInterval(tickClock, 1000);
  wireActivityTabs();

  try {
    const { clients } = await loadClients();
    dashboardClients = clients;
    renderStats(clients);
    renderPipeline(clients);
    renderRecent(clients);
    renderTopDeals(clients);
    await renderActivity(clients);
  } catch (err) {
    showToast(t('toast.dashboardLoadError'), 'error');
  }
}

window.addEventListener('langchange', () => {
  renderGreeting();
  tickClock();
  if (dashboardClients.length) {
    renderPipeline(dashboardClients);
    renderRecent(dashboardClients);
    renderTopDeals(dashboardClients);
    renderActivity(dashboardClients);
  }
});

document.addEventListener('DOMContentLoaded', initDashboard);
