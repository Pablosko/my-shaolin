async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  const errorEl = document.getElementById('register-error');
  errorEl.style.display = 'none';

  try {
    const data = await API.post('/auth/register', { username, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;

  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';

  try {
    const data = await API.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  window.location.href = '/';
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const forms = document.querySelectorAll('.auth-form');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      forms.forEach(f => f.classList.add('hidden'));
      document.getElementById(tab.dataset.tab + '-form').classList.remove('hidden');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});
