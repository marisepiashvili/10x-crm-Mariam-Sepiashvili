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
