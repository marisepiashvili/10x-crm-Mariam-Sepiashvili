function clearAllErrors(fieldIds){
    fieldIds.forEach((id) => setFieldError(id, ''));
};


function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const company = document.getElementById('company').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const fieldIds = ['fullName', 'email', 'password', 'confirmPassword'];
    clearAllErrors(fieldIds);

    let hasError = false;
    const users = getUsers();
    const emailLower = email.trim().toLowerCase();

    // Full Name
    if (fullName.trim().length < 3) {
      setFieldError('fullName', t('error.fullNameShort'));
      hasError = true;
    }

    // Email format
    const atIndex = email.indexOf('@');
    const validFormat = atIndex > 0 && email.indexOf('.', atIndex) > atIndex;
    if (!validFormat) {
      setFieldError('email', t('error.emailInvalid'));
      hasError = true;
    } else if (users.some((u) => u.email === emailLower)) {
      setFieldError('email', t('error.emailExists'));
      hasError = true;
    }

    // Password
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    if (password.length < 8 || !hasLetter || !hasDigit) {
      setFieldError('password', t('error.passwordWeak'));
      hasError = true;
    }

    // Confirm password
    if (confirmPassword !== password) {
      setFieldError('confirmPassword', t('error.passwordMismatch'));
      hasError = true;
    }

    if (hasError) return;

    const newUser = {
      id: Date.now(),
      fullName: fullName.trim(),
      email: emailLower,
      password: password,
      company: company.trim(),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    showToast(t('signup.success'));
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  });

  // Clear a field's error as soon as it becomes valid again (live UX bonus)
  ['fullName', 'email', 'password', 'confirmPassword'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => setFieldError(id, ''));
  });
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fieldIds = ['email', 'password'];
    clearAllErrors(fieldIds);

    let hasError = false;

    if (email.trim() === '') {
      setFieldError('email', t('login.error.emailRequired'));
      hasError = true;
    }
    if (password === '') {
      setFieldError('password', t('login.error.passwordRequired'));
      hasError = true;
    }
    if (hasError) return;

    const users = getUsers();
    const emailLower = email.trim().toLowerCase();
    const match = users.find((u) => u.email === emailLower && u.password === password);

    const generalError = document.getElementById('login-general-error');
    if (!match) {
      if (generalError) {
        generalError.textContent = t('login.error.invalid');
        generalError.style.display = 'block';
      }
      return;
    }
    if (generalError) generalError.style.display = 'none';

    const session = {
      userId: match.id,
      email: match.email,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    window.location.href = 'dashboard.html';
  });

  ['email', 'password'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      setFieldError(id, '');
      const generalError = document.getElementById('login-general-error');
      if (generalError) generalError.style.display = 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSignupForm();
  initLoginForm();
}); 