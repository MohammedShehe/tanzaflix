// js/scripts.js - Login Page

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const visibilityToggle = document.querySelector('.visibility-toggle');
    const submitBtn = document.querySelector('.submit-btn');

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
            button.textContent = button.dataset.originalText || 'Iingia sasa';
        }
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

            // Show loading state
            setButtonLoading(submitBtn, true, 'Inaingiza...');

            try {
                const result = await auth.login(email, password);
                
                if (result.requiresOTP) {
                    // Admin needs OTP verification
                    setButtonLoading(submitBtn, false);
                    window.location.href = `otp.html?email=${encodeURIComponent(email)}`;
                } else if (result.success) {
                    // Regular user login successful
                    setButtonLoading(submitBtn, false);
                    window.location.href = `dashboard.html?name=${encodeURIComponent(email.split('@')[0])}`;
                } else {
                    setButtonLoading(submitBtn, false);
                    alert('❌ Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                setButtonLoading(submitBtn, false);
                alert(`❌ ${error.message || 'Login failed. Please try again.'}`);
            }
        });
    }
});