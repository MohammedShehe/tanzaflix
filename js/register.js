const showAlert = (message) => {
  window.alert(message);
};

const registerForm = document.getElementById('registerForm');
const countrySelect = document.getElementById('country');
const tzAreaContainer = document.getElementById('tanzaniaRegion');
const tzSelect = document.getElementById('tzArea');
const zanzibarContainer = document.getElementById('zanzibarIslandGroup');
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');

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

// Password visibility toggles: click to show/hide per field
const setupPasswordToggles = () => {
  document.querySelectorAll('.password-group').forEach(group => {
    // Tunatafuta input yoyote iliyopo ndani ya kikundi hiki
    const passwordInput = group.querySelector('input');
    const toggleButton = group.querySelector('.visibility-toggle');

    if (toggleButton && passwordInput) {
      // Tunahakikisha rangi ya maandishi inakuwa nyeupe na background inakaa sawa mapema
      passwordInput.style.color = '#ffffff';
      passwordInput.style.backgroundColor = '#1a1f2c';

      toggleButton.addEventListener('click', function () {
        const labelSpan = toggleButton.querySelector('.vis-label');
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          if (labelSpan) {
            labelSpan.textContent = 'Ficha';
          } else {
            toggleButton.textContent = 'Ficha';
          }

          // Lulazimisha maandishi yaonekane vizuri yakishakuwa text
          passwordInput.style.color = '#ffffff';
        } else {
          passwordInput.type = 'password';
          if (labelSpan) {
            labelSpan.textContent = 'Onyesha';
          } else {
            toggleButton.textContent = 'Onyesha';
          }
        }
      });
    }
  });
};

setupPasswordToggles();

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
      showAlert('Tafadhali jaza sehemu zote muhimu za usajili.');
      return;
    }

    if (!email.includes('@')) {
      showAlert('Tafadhali tumia barua pepe halali.');
      return;
    }

    if (password !== passwordConfirm) {
      showAlert('Nenosiri zako hazilingani, tafadhali jaribu tena.');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('country', country);
    formData.append('password', password);
    formData.append('passwordConfirm', passwordConfirm);
    formData.append('tzArea', tzArea);
    formData.append('zanzibarIsland', zanzibarIsland);
    if (photoInput?.files.length > 0) {
      formData.append('photo', photoInput.files[0]);
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || result.ok === false) {
        throw new Error(result.error || 'Hitilafu ya server.');
      }

      showAlert('✅ ' + result.message + '\n\nTaarifa zako zimehifadhiwa kwa mafanikio kwenye database!');
      localStorage.setItem('tanzaflix_user', JSON.stringify(result.user));

      setTimeout(() => {
        window.location.href = `dashboard.html?name=${encodeURIComponent(result.user.full_name || result.user.email)}`;
      }, 2000);
    } catch (error) {
      showAlert(error.message || 'Hitilafu isiyojulikana iliyotokea wakati wa usajili.');
    }
  });
}
