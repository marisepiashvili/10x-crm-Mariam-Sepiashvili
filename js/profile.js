/**
 * profile.js — P5
 */

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find((u) => u.id === session.userId) || null;
}

function initials(fullName) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function renderProfileInfo() {
  const user = getCurrentUser();
  if (!user) return;

  document.getElementById('profile-initials').textContent = initials(user.fullName);
  document.getElementById('profile-name').textContent = user.fullName;
  document.getElementById('profile-meta').textContent = t('profile.meta', {
    email: user.email,
    company: user.company || t('profile.noCompany'),
    date: new Date(user.createdAt).toLocaleDateString(),
  });

  document.getElementById('fullName').value = user.fullName;
  document.getElementById('company').value = user.company || '';
}

function wireProfileForm() {
  const form = document.getElementById('profile-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const company = document.getElementById('company').value;
    setFieldError('fullName', '');

    if (fullName.trim().length < 3) {
      setFieldError('fullName', t('error.fullNameShort'));
      return;
    }

    const users = getUsers();
    const session = getSession();
    const idx = users.findIndex((u) => u.id === session.userId);
    if (idx === -1) return;

    users[idx].fullName = fullName.trim();
    users[idx].company = company.trim();
    saveUsers(users);

    renderProfileInfo();
    showToast(t('toast.profileUpdated'));
  });

  document.getElementById('fullName').addEventListener('input', () => setFieldError('fullName', ''));
}