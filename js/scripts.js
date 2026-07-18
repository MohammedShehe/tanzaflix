// Login page functionality - Frontend only simulation
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const visibilityToggle = document.querySelector('.visibility-toggle');

  // Password visibility toggle
  if (visibilityToggle && passwordInput) {
    const btn = visibilityToggle;
    btn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      const label = btn.querySelector('.vis-label');
      if (label) label.textContent = isPassword ? 'Ficha' : 'Onyesha';
      btn.setAttribute('aria-pressed', String(isPassword));
      btn.setAttribute('aria-label', isPassword ? 'Ficha nenosiri' : 'Onyesha nenosiri');
      btn.classList.toggle('active', isPassword);
    });
  }

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        alert('Tafadhali jaza barua pepe na nenosiri kwa usahihi.');
        return;
      }

      if (!email.includes('@')) {
        alert('Tafadhali tumia barua pepe halali.');
        return;
      }

      // Check if admin credentials
      const ADMIN_EMAIL = 'admin@tanzaflix.com';
      const ADMIN_PASSWORD = 'Admin@124';

      console.log('Email entered:', email);
      console.log('Password entered:', password);
      console.log('Admin email:', ADMIN_EMAIL);
      console.log('Admin password:', ADMIN_PASSWORD);
      console.log('Admin match:', email === ADMIN_EMAIL && password === ADMIN_PASSWORD);

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Admin login - store admin flag and redirect to OTP
        console.log('✅ Admin credentials matched! Redirecting to OTP...');
        const adminData = {
          email: email,
          isAdmin: true,
          name: 'Admin'
        };
        localStorage.setItem('tanzaflix_user', JSON.stringify(adminData));
        localStorage.setItem('tanzaflix_admin_session', 'true');
        window.location.href = `otp.html?email=${encodeURIComponent(email)}`;
        return;
      }

      // Normal user login
      console.log('👤 Normal user login');
      const userData = {
        name: email.split('@')[0],
        email: email,
        photo_url: ''
      };
      localStorage.setItem('tanzaflix_user', JSON.stringify(userData));
      localStorage.removeItem('tanzaflix_admin_session');
      
      window.location.href = `dashboard.html?name=${encodeURIComponent(userData.name)}`;
    });
  }
});