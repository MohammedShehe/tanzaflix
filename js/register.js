// js/register.js - Registration Page

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const countrySelect = document.getElementById('country');
    const tzAreaContainer = document.getElementById('tanzaniaRegion');
    const tzSelect = document.getElementById('tzArea');
    const zanzibarContainer = document.getElementById('zanzibarIslandGroup');
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const submitBtn = document.querySelector('.submit-btn');

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
                toggleButton.addEventListener('click', function() {
                    const labelSpan = toggleButton.querySelector('.vis-label');
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        if (labelSpan) labelSpan.textContent = 'Ficha';
                    } else {
                        passwordInput.type = 'password';
                        if (labelSpan) labelSpan.textContent = 'Onyesha';
                    }
                });
            }
        });
    };

    setupPasswordToggles();

    // ===== Set Button Loading State =====
    function setButtonLoading(button, isLoading, loadingText = 'Inapakia...') {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = `
                <span class="spinner" style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:10px;"></span>
                ${loadingText}
            `;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Jisajili sasa';
        }
    }

    // Register form submission
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
            const photo = photoInput?.files?.[0] || null;

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

            if (password.length < 6) {
                alert('Nenosiri lazima iwe na herufi 6 au zaidi.');
                return;
            }

            // Show loading state
            setButtonLoading(submitBtn, true, 'Inajisajili...');

            try {
                const userData = {
                    full_name: fullName,
                    phone: phone,
                    country: country,
                    region: country === 'Tanzania' ? (tzArea || zanzibarIsland || '') : '',
                    email: email,
                    password: password,
                    confirmPassword: passwordConfirm,
                    photo: photo
                };

                const response = await api.registerUser(userData);

                if (response.success) {
                    setButtonLoading(submitBtn, false);
                    alert('✅ Usajili wako umefanikiwa!\n\nTaarifa zako zimehifadhiwa kwa mafanikio.');
                    
                    localStorage.setItem('tanzaflix_user', JSON.stringify({
                        full_name: fullName,
                        email: email,
                        phone: phone,
                        country: country
                    }));
                    
                    setTimeout(() => {
                        window.location.href = `dashboard.html?name=${encodeURIComponent(fullName)}`;
                    }, 1500);
                } else {
                    setButtonLoading(submitBtn, false);
                    alert(`❌ ${response.message || 'Registration failed. Please try again.'}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
                setButtonLoading(submitBtn, false);
                alert(`❌ ${error.message || 'Registration failed. Please try again.'}`);
            }
        });
    }
});