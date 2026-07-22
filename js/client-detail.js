/**
 * client-detail.js
 * Shared client-details modal (status change, call timer, notes, reminder) --
 * used by both clients.js (grid/kanban cards) and dashboard.js (Recent Clients
 * / Top Deals rows). Callers pass their own loaded clients array so each page
 * keeps mutating and persisting the copy it already holds, plus an optional
 * onEdit (shows the Edit button) and onChange (re-render the caller's view
 * after a status change, note, or logged call).
 */

let callState = { interval: null, seconds: 0, clientId: null };
let detailModalCtx = null;

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

function logCallNote(clients, clientId, duration) {
  const client = clients.find((c) => String(c.id) === String(clientId));
  if (!client) return;
  client.notes = client.notes || [];
  client.notes.push({ text: t('note.callDuration', { duration }), date: new Date().toLocaleString(), type: 'call', duration });
  saveClients(clients);
  if (document.getElementById('detail-modal-backdrop').classList.contains('open')) {
    renderNotes(client);
  }
}

function toggleCall(clientId, clients, onChange) {
  const btn = document.getElementById('call-toggle-btn');
  const wrap = document.getElementById('call-timer');

  if (callState.interval) {
    clearInterval(callState.interval);
    const duration = formatMMSS(callState.seconds);
    logCallNote(clients, clientId, duration);
    callState = { interval: null, seconds: 0, clientId: null };
    updateCallDisplay();
    if (btn) btn.textContent = t('btn.startCall');
    if (wrap) wrap.classList.remove('active');
    if (onChange) onChange();
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

function openDetailModal(id, clients, { onEdit, onChange } = {}) {
  const client = clients.find((c) => String(c.id) === String(id));
  if (!client) return;

  detailModalCtx = { clients, onChange };
  resetCallState();

  const backdrop = document.getElementById('detail-modal-backdrop');
  const content = document.getElementById('detail-modal-content');

  content.innerHTML = `
    <div class="modal-head">
      <h3>${t('modal.clientDetails.title')}</h3>
      <div style="display:flex; align-items:center; gap:8px;">
        ${onEdit ? `<button class="btn btn-ghost" id="detail-edit-btn" type="button" style="width:auto; padding:6px 14px; font-size:13px;">${t('btn.edit')}</button>` : ''}
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
  if (onEdit) {
    document.getElementById('detail-edit-btn').addEventListener('click', () => {
      closeDetailModal();
      onEdit(client);
    });
  }
  backdrop.addEventListener('click', function backdropClose(e) {
    if (e.target === backdrop) {
      closeDetailModal();
      backdrop.removeEventListener('click', backdropClose);
    }
  });

  document.getElementById('detail-status-select').addEventListener('change', (e) => {
    client.status = e.target.value;
    saveClients(clients);
    e.target.className = 'status-select ' + statusBadgeClass(e.target.value);
    if (onChange) onChange();
  });

  document.getElementById('call-toggle-btn').addEventListener('click', () => toggleCall(client.id, clients, onChange));

  document.getElementById('add-note-btn').addEventListener('click', () => addNote(client.id, clients, onChange));
  document.getElementById('note-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addNote(client.id, clients, onChange);
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
  if (callState.interval && detailModalCtx) {
    logCallNote(detailModalCtx.clients, callState.clientId, formatMMSS(callState.seconds));
    if (detailModalCtx.onChange) detailModalCtx.onChange();
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
  const clients = detailModalCtx ? detailModalCtx.clients : [];
  list.querySelectorAll('.note-star-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      toggleNoteImportant(clients, sorted[i]);
      renderNotes(client);
      if (detailModalCtx && detailModalCtx.onChange) detailModalCtx.onChange();
    });
  });
  list.querySelectorAll('.note-delete-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      deleteClientNote(clients, client, sorted[i]);
      renderNotes(client);
      if (detailModalCtx && detailModalCtx.onChange) detailModalCtx.onChange();
    });
  });
}

function addNote(clientId, clients, onChange) {
  const input = document.getElementById('note-input');
  const text = input.value.trim();
  if (!text) return;

  const client = clients.find((c) => String(c.id) === String(clientId));
  if (!client) return;

  client.notes = client.notes || [];
  client.notes.push({ text, date: new Date().toLocaleString(), type: 'note', lang: getLang() });
  saveClients(clients);

  input.value = '';
  renderNotes(client);
  if (onChange) onChange();
}
