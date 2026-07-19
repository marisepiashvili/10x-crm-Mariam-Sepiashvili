
const API_BASE = 'https://dummyjson.com';

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
