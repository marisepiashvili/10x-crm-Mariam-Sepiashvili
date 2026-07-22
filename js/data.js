/**
 * data.js
 * Shared client-data layer used by dashboard.js and clients.js.
 *  - loadClients(): reads crm_clients from localStorage, or fetches DummyJSON on first run
 *  - saveClients(list): persists to localStorage
 *  - getVisibleClients(list, {status, search, sort}): filter -> search -> sort pipeline
 */

const API_BASE = 'https://dummyjson.com';

const STATUS_ORDER = ['Lead', 'Contacted', 'Won', 'Lost'];
const STATUS_LABEL_KEY = {
  Lead: 'status.lead',
  Contacted: 'status.contacted',
  Won: 'status.won',
  Lost: 'status.lost',
};

function statusBadgeClass(status) {
  return 'st-' + status.toLowerCase();
}

function getClients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.clients);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveClients(list) {
  localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(list));
}

function mapApiUserToClient(user) {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone || '',
    company: user.company && user.company.name ? user.company.name : '',
    image: user.image || `https://dummyjson.com/icon/${(user.firstName || 'user').toLowerCase()}/128`,
    status: 'Lead',
    dealValue: Math.round(500 + Math.random() * 9500),
    notes: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Loads clients: from localStorage if present, otherwise from the DummyJSON API.
 * Returns { clients, fromCache }. Throws on network failure so callers can show
 * the FULL-level error/retry state.
 */
async function loadClients() {
  const cached = getClients();
  if (cached) {
    return { clients: cached, fromCache: true };
  }
  const response = await fetch(`${API_BASE}/users?limit=30`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  const clients = data.users.map(mapApiUserToClient);
  saveClients(clients);
  return { clients, fromCache: false };
}

/**
 * Runs the status filter -> text search -> sort pipeline on a *copy* of the
 * array, so the underlying state is never mutated by a view operation.
 */
function getVisibleClients(clients, { status = 'All', search = '', sort = 'newest' } = {}) {
  let list = clients.slice();

  if (status && status !== 'All') {
    list = list.filter((c) => c.status === status);
  }

  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    );
  }

  if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'value') {
    list.sort((a, b) => b.dealValue - a.dealValue);
  } else if (sort === 'valueAsc') {
    list.sort((a, b) => a.dealValue - b.dealValue);
  }

  return list;
}

function formatCurrency(amount) {
  return '$' + Math.round(amount).toLocaleString('en-US');
}
