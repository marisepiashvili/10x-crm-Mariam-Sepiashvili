/**
 * clients.js — P4
 * The product's core screen: load, search (server-side, debounced), filter,
 * sort, add, delete, inline status change, grid/Kanban views, pagination,
 * CSV export, keyboard shortcuts, and a details modal with notes, a call
 * timer, and a follow-up reminder.
 */

let allClients = [];
let viewState = { status: 'All', search: '', sort: 'newest', view: 'grid', page: 1 };
const PAGE_SIZE = 12;

const STATUS_ORDER = ['Lead', 'Contacted', 'Won', 'Lost'];
const STATUS_LABEL_KEY = {
  Lead: 'status.lead',
  Contacted: 'status.contacted',
  Won: 'status.won',
  Lost: 'status.lost',
};

// null = no active server search, show allClients; array = server search results
let searchResults = null;
let searchTimer = null;
let searching = false;
let searchToken = 0;

/* ---------------- Loading & rendering ---------------- */

async function initClientsPage() {
  const area = document.getElementById('clients-area');
  area.innerHTML = `<div class="state-msg">${t('state.loadingClients')}</div>`;

  try {
    const { clients } = await loadClients();
    allClients = clients;
    renderClientList();
  } catch (err) {
    area.innerHTML = `
      <div class="state-msg">
        ${t('state.loadError')}
        <div><button class="btn btn-ghost retry-btn" id="retry-load" type="button">${t('btn.retry')}</button></div>
      </div>`;
    document.getElementById('retry-load').addEventListener('click', initClientsPage);
  }
}

function statusBadgeClass(status) {
  return 'st-' + status.toLowerCase();
}

function getListSource() {
  return searchResults !== null ? searchResults : allClients;
}

function getFilteredSorted() {
  return getVisibleClients(getListSource(), { status: viewState.status, search: '', sort: viewState.sort });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function renderClientList() {
  const gridArea = document.getElementById('clients-area');
  const kanbanBoard = document.getElementById('kanban-board');
  const visible = getFilteredSorted();

  if (viewState.view === 'kanban') {
    gridArea.classList.add('hidden');
    kanbanBoard.classList.remove('hidden');
    renderKanbanView(visible);
  } else {
    kanbanBoard.classList.add('hidden');
    gridArea.classList.remove('hidden');
    renderGridView(visible);
  }
}

function renderGridView(visible) {
  const area = document.getElementById('clients-area');

  if (searching) {
    area.innerHTML = `<div class="state-msg">${t('search.searching')}</div>`;
    return;
  }

  if (visible.length === 0) {
    area.innerHTML = `<div class="state-msg">${t('state.noClientsFound')}</div>`;
    return;
  }

  const pageItems = visible.slice(0, viewState.page * PAGE_SIZE);

  const grid = document.createElement('div');
  grid.className = 'client-grid';

  pageItems.forEach((client) => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.dataset.id = client.id;

    card.innerHTML = `
      <div class="client-top">
        <img src="${client.image}" alt="">
        <div style="min-width:0;">
          <div class="client-name">${escapeHtml(client.name)}</div>
          <div class="client-company">${escapeHtml(client.company || '—')}</div>
          <div class="client-email">${escapeHtml(client.email)}</div>
        </div>
      </div>
      <div class="client-bottom">
        <span class="deal-value">${formatCurrency(client.dealValue)}</span>
        <div class="client-actions">
          <select class="status-select" data-id="${client.id}">
            ${STATUS_ORDER.map(
              (s) => `<option value="${s}" ${s === client.status ? 'selected' : ''}>${t(STATUS_LABEL_KEY[s])}</option>`
            ).join('')}
          </select>
          <button class="delete-btn" data-id="${client.id}" type="button" title="Delete">&times;</button>
        </div>
      </div>
    `;

    // Card click -> details modal, but not when clicking the interactive controls
    card.addEventListener('click', (e) => {
      if (e.target.closest('select') || e.target.closest('button')) return;
      openDetailModal(client.id);
    });

    grid.appendChild(card);
  });

  area.innerHTML = '';
  area.appendChild(grid);

  if (pageItems.length < visible.length) {
    const row = document.createElement('div');
    row.className = 'load-more-row';
    row.innerHTML = `<button class="btn btn-ghost" id="load-more-btn" type="button">${t('btn.loadMore')} (${visible.length - pageItems.length})</button>`;
    area.appendChild(row);
    document.getElementById('load-more-btn').addEventListener('click', () => {
      viewState.page++;
      renderClientList();
    });
  }

  // Wire per-card controls
  area.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('click', (e) => e.stopPropagation());
    select.addEventListener('change', (e) => onStatusChange(e.target.dataset.id, e.target.value));
  });
  area.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDeleteClient(btn.dataset.id);
    });
  });
}

/* ---------------- Kanban view (drag & drop status change) ---------------- */

function renderKanbanView(visible) {
  const board = document.getElementById('kanban-board');

  board.innerHTML = STATUS_ORDER.map((status) => {
    const items = visible.filter((c) => c.status === status);
    return `
      <div class="kanban-column" data-status="${status}">
        <div class="kanban-col-head">
          <span>${t(STATUS_LABEL_KEY[status])}</span>
          <span class="kanban-col-count">${items.length}</span>
        </div>
        <div class="kanban-cards">
          ${items.map((c) => `
            <div class="kanban-card" draggable="true" data-id="${c.id}">
              <div class="kc-name">${escapeHtml(c.name)}</div>
              <div class="kc-company">${escapeHtml(c.company || '—')}</div>
              <div class="kc-value">${formatCurrency(c.dealValue)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');

  board.querySelectorAll('.kanban-card').forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('click', () => openDetailModal(card.dataset.id));
  });

  board.querySelectorAll('.kanban-column').forEach((col) => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      onStatusChange(id, col.dataset.status);
    });
  });
}

/* ---------------- Toolbar wiring ---------------- */

function wireToolbar() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value;
    viewState.search = query;
    clearTimeout(searchTimer);

    if (query.trim() === '') {
      searchResults = null;
      searching = false;
      viewState.page = 1;
      renderClientList();
      return;
    }

    searching = true;
    renderClientList();
    searchTimer = setTimeout(() => runServerSearch(query.trim()), 400);
  });

  document.querySelectorAll('#filter-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#filter-chips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      viewState.status = chip.dataset.status;
      viewState.page = 1;
      renderClientList();
    });
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    viewState.sort = e.target.value;
    viewState.page = 1;
    renderClientList();
  });

  document.querySelectorAll('.view-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      viewState.view = btn.dataset.view;
      renderClientList();
    });
  });

  document.getElementById('export-csv-btn').addEventListener('click', exportClientsCsv);
}

/* ---------------- Server-side search (debounced) ---------------- */

async function runServerSearch(query) {
  const token = ++searchToken;
  try {
    const response = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search request failed');
    const data = await response.json();
    if (token !== searchToken) return; // a newer search already superseded this one
    searchResults = data.users.map(mapApiUserToClient);
  } catch (err) {
    if (token !== searchToken) return;
    searchResults = [];
    showToast(t('toast.searchError'), 'error');
  } finally {
    if (token === searchToken) {
      searching = false;
      viewState.page = 1;
      renderClientList();
    }
  }
}

/* ---------------- CSV export ---------------- */

function csvEscape(value) {
  const str = String(value == null ? '' : value);
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

function exportClientsCsv() {
  const rows = getFilteredSorted();
  const header = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Deal Value', 'Created At'];
  const lines = [header.join(',')];

  rows.forEach((c) => {
    lines.push([
      csvEscape(c.name),
      csvEscape(c.email),
      csvEscape(c.phone),
      csvEscape(c.company),
      csvEscape(c.status),
      csvEscape(c.dealValue),
      csvEscape(c.createdAt),
    ].join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------- Keyboard shortcuts ---------------- */

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function wireKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('detail-modal-backdrop').classList.contains('open')) {
        closeDetailModal();
      } else if (document.getElementById('add-modal-backdrop').classList.contains('open')) {
        closeAddModal();
      }
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(document.activeElement)) return;

    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      openAddModal();
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      exportClientsCsv();
    }
  });
}

/* ---------------- Status change (P4.6) ---------------- */

function onStatusChange(id, newStatus) {
  const client = allClients.find((c) => String(c.id) === String(id));
  if (!client) return;
  client.status = newStatus;
  saveClients(allClients);
  renderClientList();
}

/* ---------------- Delete (P4.5) ---------------- */

async function onDeleteClient(id) {
  const confirmed = confirm(t('confirm.deleteClient'));
  if (!confirmed) return;

  try {
    await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
  } catch (err) {
    // DummyJSON simulates deletes; a network hiccup or a 404 for
    // locally-added clients is expected and does not block local removal.
  } finally {
    allClients = allClients.filter((c) => String(c.id) !== String(id));
    saveClients(allClients);
    renderClientList();
    showToast(t('toast.clientDeleted'));
  }
}
