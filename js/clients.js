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