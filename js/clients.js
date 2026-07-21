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
let selectedIds = new Set();
let editingClient = null;
let pendingPhotoDataUrl = null;

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

  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  if (viewState.page > totalPages) viewState.page = totalPages;
  const pageItems = visible.slice((viewState.page - 1) * PAGE_SIZE, viewState.page * PAGE_SIZE);

  area.innerHTML = '';

  const bar = document.createElement('div');
  bar.className = 'bulk-bar';
  bar.id = 'bulk-bar';
  area.appendChild(bar);
  renderBulkBar(pageItems);

  const grid = document.createElement('div');
  grid.className = 'client-grid';

  pageItems.forEach((client) => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.dataset.id = client.id;

    card.innerHTML = `
      <div class="client-top">
        <input type="checkbox" class="clay-checkbox client-checkbox" data-id="${client.id}" ${selectedIds.has(String(client.id)) ? 'checked' : ''}>
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
          <select class="status-select ${statusBadgeClass(client.status)}" data-id="${client.id}">
            ${STATUS_ORDER.map(
              (s) => `<option value="${s}" ${s === client.status ? 'selected' : ''}>${t(STATUS_LABEL_KEY[s])}</option>`
            ).join('')}
          </select>
          <button class="edit-btn" data-id="${client.id}" type="button" title="${t('btn.edit')}">&#9998;</button>
          <button class="delete-btn" data-id="${client.id}" type="button" title="Delete">&times;</button>
        </div>
      </div>
    `;

    // Card click -> details modal, but not when clicking the interactive controls
    card.addEventListener('click', (e) => {
      if (e.target.closest('select') || e.target.closest('button') || e.target.closest('input')) return;
      openDetailModal(client.id);
    });

    grid.appendChild(card);
  });

  area.appendChild(grid);

  if (totalPages > 1) {
    const row = document.createElement('div');
    row.className = 'pagination-row';
    let html = `<button class="page-btn" id="page-prev" type="button" ${viewState.page === 1 ? 'disabled' : ''}>&lsaquo;</button>`;
    for (let p = 1; p <= totalPages; p++) {
      html += `<button class="page-btn${p === viewState.page ? ' active' : ''}" data-page="${p}" type="button">${p}</button>`;
    }
    html += `<button class="page-btn" id="page-next" type="button" ${viewState.page === totalPages ? 'disabled' : ''}>&rsaquo;</button>`;
    row.innerHTML = html;
    area.appendChild(row);

    row.querySelectorAll('.page-btn[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        viewState.page = Number(btn.dataset.page);
        renderClientList();
      });
    });
    const prevBtn = document.getElementById('page-prev');
    const nextBtn = document.getElementById('page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (viewState.page > 1) { viewState.page--; renderClientList(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      if (viewState.page < totalPages) { viewState.page++; renderClientList(); }
    });
  }

  // Wire per-card controls
  area.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('click', (e) => e.stopPropagation());
    select.addEventListener('change', (e) => onStatusChange(e.target.dataset.id, e.target.value));
  });
  area.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const client = allClients.find((c) => String(c.id) === String(btn.dataset.id));
      if (client) openClientModal(client);
    });
  });
  area.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDeleteClient(btn.dataset.id);
    });
  });
  area.querySelectorAll('.client-checkbox').forEach((cb) => {
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', (e) => {
      toggleClientSelection(e.target.dataset.id, e.target.checked);
    });
  });
}

/* ---------------- Multi-select / bulk actions ---------------- */

function toggleClientSelection(id, checked) {
  if (checked) selectedIds.add(String(id));
  else selectedIds.delete(String(id));
  renderBulkBar(getFilteredSorted().slice((viewState.page - 1) * PAGE_SIZE, viewState.page * PAGE_SIZE));
}

function renderBulkBar(pageItems) {
  const bar = document.getElementById('bulk-bar');
  if (!bar) return;

  if (pageItems.length === 0) {
    bar.innerHTML = '';
    return;
  }

  const pageIds = pageItems.map((c) => String(c.id));
  const allOnPageSelected = pageIds.every((id) => selectedIds.has(id));
  const anySelected = selectedIds.size > 0;

  bar.innerHTML = `
    <label class="bulk-select-all">
      <input type="checkbox" class="clay-checkbox" id="select-all-checkbox" ${allOnPageSelected ? 'checked' : ''}>
      <span>${t('bulk.selectAll')}</span>
    </label>
    ${anySelected ? `
    <div class="bulk-actions">
      <span class="bulk-count">${t('bulk.selectedCount', { count: selectedIds.size })}</span>
      <select class="sort-select" id="bulk-status-select">
        <option value="" selected disabled>${t('bulk.changeStatus')}</option>
        ${STATUS_ORDER.map((s) => `<option value="${s}">${t(STATUS_LABEL_KEY[s])}</option>`).join('')}
      </select>
      <button class="btn btn-danger-ghost" id="bulk-delete-btn" type="button">${t('bulk.deleteSelected')}</button>
      <button class="btn btn-ghost" id="bulk-clear-btn" type="button">${t('bulk.clearSelection')}</button>
    </div>` : ''}
  `;

  document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
    if (e.target.checked) pageIds.forEach((id) => selectedIds.add(id));
    else pageIds.forEach((id) => selectedIds.delete(id));
    renderClientList();
  });

  const delBtn = document.getElementById('bulk-delete-btn');
  if (delBtn) delBtn.addEventListener('click', onBulkDelete);

  const clearBtn = document.getElementById('bulk-clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => { selectedIds.clear(); renderClientList(); });

  const statusSel = document.getElementById('bulk-status-select');
  if (statusSel) statusSel.addEventListener('change', (e) => onBulkStatusChange(e.target.value));
}

async function onBulkDelete() {
  const ids = Array.from(selectedIds);
  if (ids.length === 0) return;

  const confirmed = confirm(t('confirm.bulkDelete', { count: ids.length }));
  if (!confirmed) return;

  await Promise.allSettled(ids.map((id) => fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' })));

  allClients = allClients.filter((c) => !selectedIds.has(String(c.id)));
  selectedIds.clear();
  saveClients(allClients);
  renderClientList();
  showToast(t('toast.bulkDeleted', { count: ids.length }));
}

function onBulkStatusChange(newStatus) {
  if (!newStatus) return;
  allClients.forEach((c) => {
    if (selectedIds.has(String(c.id))) c.status = newStatus;
  });
  saveClients(allClients);
  selectedIds.clear();
  renderClientList();
  showToast(t('toast.bulkStatusChanged'));
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
      selectedIds.clear();
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
      selectedIds.clear();
      renderClientList();
    });
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    viewState.sort = e.target.value;
    viewState.page = 1;
    selectedIds.clear();
    renderClientList();
  });

  document.querySelectorAll('.view-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      viewState.view = btn.dataset.view;
      selectedIds.clear();
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
      selectedIds.clear();
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
    selectedIds.delete(String(id));
    saveClients(allClients);
    renderClientList();
    showToast(t('toast.clientDeleted'));
  }
}

/* ---------------- Add / Edit Client modal (P4.4) ---------------- */

function initialsAvatarDataUrl(name) {
  const label = initials(name || '') || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
    <rect width="128" height="128" rx="64" fill="#8B5CFF"/>
    <text x="64" y="64" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${escapeHtml(label)}</text>
  </svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function updateAvatarPreview(client) {
  const img = document.getElementById('avatar-preview');
  if (pendingPhotoDataUrl) {
    img.src = pendingPhotoDataUrl;
  } else if (client && client.image) {
    img.src = client.image;
  } else {
    img.src = initialsAvatarDataUrl(document.getElementById('name').value);
  }
}

function openClientModal(client) {
  editingClient = client || null;
  pendingPhotoDataUrl = null;

  const form = document.getElementById('add-client-form');
  form.reset();
  ['name', 'clientEmail', 'phone', 'company', 'dealValue'].forEach((id) => setFieldError(id, ''));

  document.getElementById('add-modal-title').textContent = editingClient ? t('modal.editClient.title') : t('modal.addClient.title');
  document.getElementById('add-client-submit-btn').textContent = editingClient ? t('btn.editClientSubmit') : t('btn.addClientSubmit');

  if (editingClient) {
    document.getElementById('name').value = editingClient.name;
    document.getElementById('clientEmail').value = editingClient.email;
    document.getElementById('phone').value = editingClient.phone;
    document.getElementById('company').value = editingClient.company;
    document.getElementById('dealValue').value = editingClient.dealValue;
    document.getElementById('status').value = editingClient.status;
  }

  updateAvatarPreview(editingClient);
  document.getElementById('upload-filename').textContent = t('field.noFileChosen');
  document.getElementById('add-modal-backdrop').classList.add('open');
}

function openAddModal() {
  openClientModal(null);
}

function closeAddModal() {
  const backdrop = document.getElementById('add-modal-backdrop');
  const form = document.getElementById('add-client-form');
  backdrop.classList.remove('open');
  form.reset();
  ['name', 'clientEmail', 'phone', 'company', 'dealValue'].forEach((id) => setFieldError(id, ''));
  editingClient = null;
  pendingPhotoDataUrl = null;
}

function wireAddModal() {
  const backdrop = document.getElementById('add-modal-backdrop');
  const openBtn = document.getElementById('open-add-client');
  const closeBtn = document.getElementById('add-modal-close');
  const form = document.getElementById('add-client-form');

  openBtn.addEventListener('click', openAddModal);
  closeBtn.addEventListener('click', closeAddModal);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeAddModal(); });

  document.getElementById('clientPhoto').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      pendingPhotoDataUrl = null;
      updateAvatarPreview(editingClient);
      document.getElementById('upload-filename').textContent = t('field.noFileChosen');
      return;
    }
    document.getElementById('upload-filename').textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      pendingPhotoDataUrl = reader.result;
      document.getElementById('avatar-preview').src = pendingPhotoDataUrl;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('phone').value;
    const company = document.getElementById('company').value;
    const dealValueRaw = document.getElementById('dealValue').value;
    const status = document.getElementById('status').value;

    const fieldIds = ['name', 'clientEmail', 'phone', 'company', 'dealValue'];
    fieldIds.forEach((id) => setFieldError(id, ''));
    let hasError = false;

    if (name.trim().length < 3) {
      setFieldError('name', t('validation.nameShort'));
      hasError = true;
    }

    const atIndex = email.indexOf('@');
    const validFormat = atIndex > 0 && email.indexOf('.', atIndex) > atIndex;
    if (!validFormat) {
      setFieldError('clientEmail', t('validation.emailInvalid'));
      hasError = true;
    } else if (allClients.some((c) => c.email.toLowerCase() === email.trim().toLowerCase() && (!editingClient || String(c.id) !== String(editingClient.id)))) {
      setFieldError('clientEmail', t('validation.emailExists'));
      hasError = true;
    }

    if (phone.trim() !== '' && phone.trim().length < 6) {
      setFieldError('phone', t('validation.phoneShort'));
      hasError = true;
    }

    const dealValue = Number(dealValueRaw);
    if (dealValueRaw.trim() === '' || isNaN(dealValue) || dealValue <= 0) {
      setFieldError('dealValue', t('validation.dealValueInvalid'));
      hasError = true;
    }

    if (hasError) return;

    if (editingClient) {
      try {
        await fetch(`${API_BASE}/users/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: name.trim() }),
        });
      } catch (err) {
        // DummyJSON simulates updates; a network hiccup or a 404 for
        // locally-added/edited clients is expected and does not block the local update.
      } finally {
        const client = allClients.find((c) => String(c.id) === String(editingClient.id));
        client.name = name.trim();
        client.email = email.trim().toLowerCase();
        client.phone = phone.trim();
        client.company = company.trim();
        client.dealValue = dealValue;
        client.status = status;
        if (pendingPhotoDataUrl) client.image = pendingPhotoDataUrl;

        saveClients(allClients);
        renderClientList();
        closeAddModal();
        showToast(t('toast.clientUpdated'));
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: name.trim() }),
      });
      const result = await response.json();

      const newClient = {
        id: result.id || Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim(),
        image: pendingPhotoDataUrl || initialsAvatarDataUrl(name.trim()),
        status: status,
        dealValue: dealValue,
        notes: [],
        createdAt: new Date().toISOString(),
      };

      allClients.unshift(newClient);
      saveClients(allClients);
      renderClientList();
      closeAddModal();
      showToast(t('toast.clientAdded'));
    } catch (err) {
      showToast(t('toast.addClientError'), 'error');
    }
  });

  ['name', 'clientEmail', 'phone', 'dealValue'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => setFieldError(id, ''));
  });

  document.getElementById('name').addEventListener('input', () => {
    if (!editingClient && !pendingPhotoDataUrl) updateAvatarPreview(null);
  });
}

/* ---------------- Call timer (Start/End Call stopwatch) ---------------- */

let callState = { interval: null, seconds: 0, clientId: null };

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function updateCallDisplay() {
  const el = document.getElementById('call-timer-display');
  if (el) el.textContent = formatMMSS(callState.seconds);
}

function resetCallState() {
  if (callState.interval) clearInterval(callState.interval);
  callState = { interval: null, seconds: 0, clientId: null };
}

function logCallNote(clientId, duration) {
  const client = allClients.find((c) => String(c.id) === String(clientId));
  if (!client) return;
  client.notes = client.notes || [];
  client.notes.push({ text: t('note.callDuration', { duration }), date: new Date().toLocaleString(), type: 'call', duration });
  saveClients(allClients);
  if (document.getElementById('detail-modal-backdrop').classList.contains('open')) {
    renderNotes(client);
  }
}

function toggleCall(clientId) {
  const btn = document.getElementById('call-toggle-btn');
  const wrap = document.getElementById('call-timer');

  if (callState.interval) {
    clearInterval(callState.interval);
    const duration = formatMMSS(callState.seconds);
    logCallNote(clientId, duration);
    callState = { interval: null, seconds: 0, clientId: null };
    updateCallDisplay();
    if (btn) btn.textContent = t('btn.startCall');
    if (wrap) wrap.classList.remove('active');
  } else {
    callState.clientId = clientId;
    callState.seconds = 0;
    updateCallDisplay();
    callState.interval = setInterval(() => {
      callState.seconds++;
      updateCallDisplay();
    }, 1000);
    if (btn) btn.textContent = t('btn.endCall');
    if (wrap) wrap.classList.add('active');
  }
}

/* ---------------- Details modal (P4.8) ---------------- */

function openDetailModal(id) {
  const client = allClients.find((c) => String(c.id) === String(id));
  if (!client) return;

  resetCallState();

  const backdrop = document.getElementById('detail-modal-backdrop');
  const content = document.getElementById('detail-modal-content');

  content.innerHTML = `
    <div class="modal-head">
      <h3>${t('modal.clientDetails.title')}</h3>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="btn btn-ghost" id="detail-edit-btn" type="button" style="width:auto; padding:6px 14px; font-size:13px;">${t('btn.edit')}</button>
        <button class="modal-close" id="detail-modal-close" type="button">&times;</button>
      </div>
    </div>
    <div class="detail-top">
      <img src="${client.image}" alt="">
      <div>
        <div class="client-name">${escapeHtml(client.name)}</div>
        <div class="detail-meta">${t('detail.clientSince', { date: new Date(client.createdAt).toLocaleDateString() })}</div>
      </div>
    </div>
    <div class="detail-grid">
      <div><span>${t('detail.company')}</span>${escapeHtml(client.company || '—')}</div>
      <div><span>${t('detail.status')}</span>
        <select class="status-select ${statusBadgeClass(client.status)}" id="detail-status-select">
          ${STATUS_ORDER.map(
            (s) => `<option value="${s}" ${s === client.status ? 'selected' : ''}>${t(STATUS_LABEL_KEY[s])}</option>`
          ).join('')}
        </select>
      </div>
      <div><span>${t('detail.email')}</span>${escapeHtml(client.email)}</div>
      <div><span>${t('detail.phone')}</span>${escapeHtml(client.phone || '—')}</div>
      <div style="grid-column:1 / -1;"><span>${t('detail.dealValue')}</span>${formatCurrency(client.dealValue)}</div>
    </div>
    <div class="call-timer" id="call-timer">
      <span class="call-timer-display" id="call-timer-display">00:00</span>
      <button class="btn btn-ghost" id="call-toggle-btn" type="button">${t('btn.startCall')}</button>
    </div>
    <h3 style="font-family:var(--font-display); font-size:15px; margin:0 0 8px;">${t('notes.title')}</h3>
    <div class="notes-list" id="notes-list"></div>
    <div class="note-add">
      <input type="text" id="note-input" placeholder="${t('notes.placeholder')}">
      <button class="btn btn-ghost" id="add-note-btn" type="button">${t('btn.addNote')}</button>
    </div>
    <div class="reminder-row">
      <select class="sort-select" id="reminder-select">
        <option value="1">${t('reminder.min1')}</option>
        <option value="5">${t('reminder.min5')}</option>
        <option value="15">${t('reminder.min15')}</option>
        <option value="30">${t('reminder.min30')}</option>
        <option value="60">${t('reminder.hour1')}</option>
        <option value="120">${t('reminder.hour2')}</option>
        <option value="180">${t('reminder.hour3')}</option>
        <option value="360">${t('reminder.hour6')}</option>
        <option value="720">${t('reminder.hour12')}</option>
      </select>
      <button class="btn btn-ghost" id="remind-btn" type="button">${t('btn.setReminder')}</button>
    </div>
  `;

  renderNotes(client);

  document.getElementById('detail-modal-close').addEventListener('click', closeDetailModal);
  document.getElementById('detail-edit-btn').addEventListener('click', () => {
    closeDetailModal();
    openClientModal(client);
  });
  backdrop.addEventListener('click', function backdropClose(e) {
    if (e.target === backdrop) {
      closeDetailModal();
      backdrop.removeEventListener('click', backdropClose);
    }
  });

  document.getElementById('detail-status-select').addEventListener('change', (e) => {
    onStatusChange(client.id, e.target.value);
    e.target.className = 'status-select ' + statusBadgeClass(e.target.value);
  });

  document.getElementById('call-toggle-btn').addEventListener('click', () => toggleCall(client.id));

  document.getElementById('add-note-btn').addEventListener('click', () => addNote(client.id));
  document.getElementById('note-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addNote(client.id);
  });

  document.getElementById('remind-btn').addEventListener('click', () => {
    const minutes = parseInt(document.getElementById('reminder-select').value, 10);
    const noteText = document.getElementById('note-input').value.trim();
    const reminderText = noteText ? `${client.name} — ${noteText}` : client.name;
    showToast(t('toast.reminderSet'));
    setTimeout(() => {
      showTopToast(t('toast.reminderFired', { text: reminderText }));
    }, minutes * 60000);
  });

  backdrop.classList.add('open');
}

function closeDetailModal() {
  if (callState.interval) {
    logCallNote(callState.clientId, formatMMSS(callState.seconds));
  }
  resetCallState();
  document.getElementById('detail-modal-backdrop').classList.remove('open');
}

async function renderNotes(client) {
  const list = document.getElementById('notes-list');
  if (!client.notes || client.notes.length === 0) {
    list.innerHTML = `<div class="note-empty">${t('notes.empty')}</div>`;
    return;
  }
  const sorted = client.notes.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const rows = await Promise.all(sorted.map(async (n) => {
    const text = await getTranslatedNoteText(n);
    return `
      <div class="note-item${n.important ? ' is-important' : ''}">
        <div class="note-body">${escapeHtml(text)}<span class="ndate">${escapeHtml(n.date)}</span></div>
        <div class="note-actions">
          <button class="note-star-btn${n.important ? ' active' : ''}" type="button" title="${t('btn.markImportant')}">★</button>
          <button class="note-delete-btn" type="button" title="${t('btn.deleteNote')}">&times;</button>
        </div>
      </div>`;
  }));
  list.innerHTML = rows.join('');

  // sorted[i] and the rendered .note-item at the same index are the exact
  // same object references as client.notes -- no id field needed to find
  // which one to act on.
  list.querySelectorAll('.note-star-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      toggleNoteImportant(allClients, sorted[i]);
      renderNotes(client);
    });
  });
  list.querySelectorAll('.note-delete-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      deleteClientNote(allClients, client, sorted[i]);
      renderNotes(client);
    });
  });
}

function addNote(clientId) {
  const input = document.getElementById('note-input');
  const text = input.value.trim();
  if (!text) return;

  const client = allClients.find((c) => String(c.id) === String(clientId));
  if (!client) return;

  client.notes = client.notes || [];
  client.notes.push({ text, date: new Date().toLocaleString(), type: 'note', lang: getLang() });
  saveClients(allClients);

  input.value = '';
  renderNotes(client);
}

/* ---------------- Init ---------------- */

window.addEventListener('langchange', () => {
  if (allClients.length) renderClientList();
});

document.addEventListener('DOMContentLoaded', () => {
  wireToolbar();
  wireAddModal();
  wireKeyboardShortcuts();
  initClientsPage();
});
