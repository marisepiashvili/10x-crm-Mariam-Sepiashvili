/**
 * profile.js — P5
 */

let pendingPhotoDataUrl = null;

function updateAvatarPreview(user) {
  const src = pendingPhotoDataUrl || (user && user.image) || initialsAvatarDataUrl(user ? user.fullName : '');
  document.getElementById('profile-avatar').src = src;
  document.getElementById('avatar-preview').src = src;
}

function renderProfileInfo() {
  const user = getCurrentUser();
  if (!user) return;

  updateAvatarPreview(user);
  document.getElementById('profile-name').textContent = user.fullName;
  document.getElementById('profile-meta').textContent = t('profile.meta', {
    email: user.email,
    company: user.company || t('profile.noCompany'),
    date: new Date(user.createdAt).toLocaleDateString(),
  });

  document.getElementById('fullName').value = user.fullName;
  document.getElementById('company').value = user.company || '';
}

function wireProfilePhotoUpload() {
  document.getElementById('profilePhoto').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      pendingPhotoDataUrl = null;
      updateAvatarPreview(getCurrentUser());
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
}

function wireProfileForm() {
  const form = document.getElementById('profile-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const company = document.getElementById('company').value;
    setFieldError('fullName', '');

    let hasError = false;

    if (fullName.trim().length < 3) {
      setFieldError('fullName', t('error.fullNameShort'));
      hasError = true;
    }

    if (hasError) return;

    const users = getUsers();
    const session = getSession();
    const idx = users.findIndex((u) => u.id === session.userId);
    if (idx === -1) return;

    users[idx].fullName = fullName.trim();
    users[idx].company = company.trim();
    if (pendingPhotoDataUrl) users[idx].image = pendingPhotoDataUrl;
    saveUsers(users);

    pendingPhotoDataUrl = null;
    document.getElementById('upload-filename').textContent = t('field.noFileChosen');
    renderProfileInfo();
    wireAppShell();
    showToast(t('toast.profileUpdated'));
  });

  document.getElementById('fullName').addEventListener('input', () => setFieldError('fullName', ''));
}

function wirePasswordForm() {
  const form = document.getElementById('password-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const current = document.getElementById('currentPassword').value;
    const next = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;

    ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach((id) => setFieldError(id, ''));

    const users = getUsers();
    const session = getSession();
    const idx = users.findIndex((u) => u.id === session.userId);
    if (idx === -1) return;
    const user = users[idx];

    let hasError = false;

    if (current !== user.password) {
      setFieldError('currentPassword', t('validation.currentPasswordWrong'));
      hasError = true;
    }

    const hasLetter = /[a-zA-Z]/.test(next);
    const hasDigit = /[0-9]/.test(next);
    if (next.length < 8 || !hasLetter || !hasDigit) {
      setFieldError('newPassword', t('error.passwordWeak'));
      hasError = true;
    } else if (next === user.password) {
      setFieldError('newPassword', t('validation.passwordSameAsOld'));
      hasError = true;
    }

    if (confirm !== next) {
      setFieldError('confirmNewPassword', t('error.passwordMismatch'));
      hasError = true;
    }

    if (hasError) return;

    users[idx].password = next;
    saveUsers(users);
    form.reset();
    showToast(t('toast.passwordChanged'));
  });

  ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => setFieldError(id, ''));
  });
}

function wireResetData() {
  document.getElementById('reset-data-btn').addEventListener('click', async () => {
    const confirmed = confirm(t('confirm.resetData'));
    if (!confirmed) return;

    localStorage.removeItem(clientsStorageKey());
    try {
      await loadClients();
      showToast(t('toast.dataReset'));
    } catch (err) {
      showToast(t('toast.dataResetError'), 'error');
    }
  });
}

window.addEventListener('langchange', renderProfileInfo);

document.addEventListener('DOMContentLoaded', () => {
  renderProfileInfo();
  wireProfileForm();
  wireProfilePhotoUpload();
  wirePasswordForm();
  wireResetData();
});
