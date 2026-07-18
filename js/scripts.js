const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const visibilityToggle = document.querySelector('.visibility-toggle');

const showAlert = (message) => {
  window.alert(message);
};

const safeFetch = async (url, dto) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const result = await response.json();
  if (!response.ok || result.ok === false) {
    throw new Error(result.error || 'Hitilafu ya server.');
  }

  return result;
};

if (visibilityToggle && passwordInput) {
  const btn = visibilityToggle;
  btn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    const label = btn.querySelector('.vis-label');
    if (label) label.textContent = isPassword ? 'Ficha' : 'Onyesha';
    else btn.textContent = isPassword ? 'Ficha' : 'Onyesha';
    btn.setAttribute('aria-pressed', String(isPassword));
    btn.setAttribute('aria-label', isPassword ? 'Ficha nenosiri' : 'Onyesha nenosiri');
    btn.classList.toggle('active', isPassword);
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showAlert('Tafadhali jaza barua pepe na nenosiri kwa usahihi.');
      return;
    }

    if (!email.includes('@')) {
      showAlert('Tafadhali tumia barua pepe halali.');
      return;
    }

    try {
      console.log('Login attempt with email:', email);
      const result = await safeFetch('http://localhost:5001/api/auth/login', { email, password });
      console.log('Login successful:', result);
      localStorage.setItem('tanzaflix_user', JSON.stringify(result.user));
      window.location.href = `dashboard.html?name=${encodeURIComponent(result.user.name || result.user.email)}`;
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Hitilafu ya login: ' + error.message);
    }
  });
}

