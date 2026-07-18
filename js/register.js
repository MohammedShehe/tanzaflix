document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const countrySelect = document.getElementById('country');
  const tzAreaContainer = document.getElementById('tanzaniaRegion');
  const tzSelect = document.getElementById('tzArea');
  const zanzibarContainer = document.getElementById('zanzibarIslandGroup');
  const photoInput = document.getElementById('photo');
  const photoPreview = document.getElementById('photoPreview');

  // Update region fields based on country selection
  const updateRegionFields = () => {
    if (!countrySelect || !tzAreaContainer || !tzSelect || !zanzibarContainer) return;

    const value = countrySelect.value;
    if (value === 'Tanzania') {
      tzAreaContainer.classList.remove('hidden');
      zanzibarContainer.classList.toggle('hidden', tzSelect.value !== 'Zanzibar');
    } else {
      tzAreaContainer.classList.add('hidden');
      zanzibarContainer.classList.add('hidden');
    }
  };

  if (countrySelect) {
    countrySelect.addEventListener('change', updateRegionFields);
  }

  if (tzSelect) {
    tzSelect.addEventListener('change', updateRegionFields);
  }

  // Photo preview
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files?.[0];
      if (!file) {
        photoPreview.classList.add('hidden');
        photoPreview.innerHTML = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        photoPreview.classList.remove('hidden');
        photoPreview.innerHTML = `<img src="${reader.result}" alt="Picha ya wasifu" />`;
      };
      reader.readAsDataURL(file);
    });
  }

  // Password visibility toggles
  const setupPasswordToggles = () => {
    document.querySelectorAll('.password-group').forEach(group => {
      const passwordInput = group.querySelector('input');
      const toggleButton = group.querySelector('.visibility-toggle');

      if (toggleButton && passwordInput) {
        passwordInput.style.color = '#ffffff';
        passwordInput.style.backgroundColor = '#1a1f2c';

        toggleButton.addEventListener('click', function() {
          const labelSpan = toggleButton.querySelector('.vis-label');
          if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            if (labelSpan) labelSpan.textContent = 'Ficha';
            passwordInput.style.color = '#ffffff';
          } else {
            passwordInput.type = 'password';
            if (labelSpan) labelSpan.textContent = 'Onyesha';
          }
        });
      }
    });
  };

  setupPasswordToggles();

  // Register form submission - Frontend only
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('emailRegister').value.trim();
      const password = document.getElementById('passwordRegister').value.trim();
      const passwordConfirm = document.getElementById('passwordConfirm').value.trim();
      const country = countrySelect ? countrySelect.value : '';
      const tzArea = tzSelect ? tzSelect.value : '';
      const zanzibarIsland = document.getElementById('zanzibarIsland')?.value || '';

      if (!fullName || !phone || !email || !password || !passwordConfirm || !country) {
        alert('Tafadhali jaza sehemu zote muhimu za usajili.');
        return;
      }

      if (!email.includes('@')) {
        alert('Tafadhali tumia barua pepe halali.');
        return;
      }

      if (password !== passwordConfirm) {
        alert('Nenosiri zako hazilingani, tafadhali jaribu tena.');
        return;
      }

      // Simulate registration - store user in localStorage
      const userData = {
        full_name: fullName,
        email: email,
        phone: phone,
        country: country,
        region: tzArea || zanzibarIsland || '',
        photo_url: ''
      };
      
      // Handle photo if available
      if (photoInput && photoInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
          userData.photo_url = e.target.result;
          localStorage.setItem('tanzaflix_user', JSON.stringify(userData));
        };
        reader.readAsDataURL(photoInput.files[0]);
      } else {
        localStorage.setItem('tanzaflix_user', JSON.stringify(userData));
      }

      alert('✅ Usajili wako umefanikiwa!\n\nTaarifa zako zimehifadhiwa kwa mafanikio.');
      
      setTimeout(() => {
        window.location.href = `dashboard.html?name=${encodeURIComponent(fullName)}`;
      }, 1500);
    });
  }
});