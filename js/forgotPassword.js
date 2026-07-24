// js/forgotPassword.js - Forgot Password Page

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM refs =====
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const dot1 = document.getElementById('step1Dot');
    const dot2 = document.getElementById('step2Dot');
    const dot3 = document.getElementById('step3Dot');
    const emailForm = document.getElementById('emailStepForm');
    const otpForm = document.getElementById('otpStepForm');
    const passwordForm = document.getElementById('passwordStepForm');
    const forgotEmail = document.getElementById('forgotEmail');
    const emailMessage = document.getElementById('emailMessage');
    const otpMessage = document.getElementById('otpMessage');
    const passwordMessage = document.getElementById('passwordMessage');
    const otpInputs = document.querySelectorAll('#otpInputGroup .otp-input');
    const otpEmailDisplay = document.getElementById('otpEmailDisplay');
    const timerCount = document.getElementById('otpTimerCount');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const backToEmail = document.getElementById('backToEmail');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // ===== State =====
    let timerInterval = null;
    let timeLeft = 120;
    let resendCooldown = 0;
    let resendCooldownInterval = null;
    let isResending = false;
    let isVerified = false;
    let userEmail = '';
    let resetToken = '';

    // ===== Utility: show step =====
    function showStep(step) {
        [step1, step2, step3].forEach(el => el.classList.remove('active'));
        [dot1, dot2, dot3].forEach(el => el.classList.remove('active', 'completed'));
        if (step === 1) { step1.classList.add('active'); dot1.classList.add('active'); }
        else if (step === 2) { step2.classList.add('active'); dot1.classList.add('completed'); dot2.classList.add('active'); }
        else if (step === 3) { step3.classList.add('active'); dot1.classList.add('completed'); dot2.classList.add('completed'); dot3.classList.add('active'); }
    }

    // ===== Set Button Loading State - PRESERVES inner content =====
    function setButtonLoading(button, isLoading, loadingText = 'Inapakia...') {
        if (isLoading) {
            button.disabled = true;
            // Store original HTML, not just text
            if (!button.dataset.originalHtml) {
                button.dataset.originalHtml = button.innerHTML;
            }
            button.innerHTML = `
                <span class="spinner" style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:10px;"></span>
                ${loadingText}
            `;
        } else {
            button.disabled = false;
            const originalHtml = button.dataset.originalHtml || 'Tuma OTP';
            button.innerHTML = originalHtml;
            delete button.dataset.originalHtml;
        }
    }

    // ===== Show/Hide Messages =====
    function showMessage(element, message, type = 'info') {
        element.textContent = message;
        element.className = `forgot-message show ${type}`;
    }

    function hideMessage(element) {
        element.className = 'forgot-message';
        element.textContent = '';
    }

    // ===== STEP 1: Send OTP =====
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = forgotEmail.value.trim();
        
        if (!email || !email.includes('@')) {
            showMessage(emailMessage, '⚠️ Tafadhali ingiza barua pepe halali.', 'error');
            return;
        }

        setButtonLoading(sendOtpBtn, true, 'Inatuma...');
        hideMessage(emailMessage);

        try {
            const response = await auth.forgotPassword(email);
            
            if (response.success) {
                userEmail = email;
                otpEmailDisplay.textContent = email;
                showMessage(emailMessage, '✅ Nambari ya OTP imetumwa kwa barua pepe yako.', 'success');
                setButtonLoading(sendOtpBtn, false);
                
                setTimeout(() => {
                    showStep(2);
                    startOtpTimer();
                    document.getElementById('fotp1').focus();
                    otpInputs.forEach(inp => { inp.value = ''; inp.classList.remove('filled', 'error'); });
                    hideMessage(otpMessage);
                }, 1200);
            } else {
                throw new Error(response.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setButtonLoading(sendOtpBtn, false);
            showMessage(emailMessage, `❌ ${error.message || 'Tumeshindwa kutuma OTP. Tafadhali jaribu tena.'}`, 'error');
        }
    });

    // ===== OTP Input Handling =====
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (!/^\d*$/.test(this.value)) { 
                this.value = this.value.replace(/\D/g, ''); 
                return; 
            }
            this.classList.remove('error');
            hideMessage(otpMessage);
            if (this.value.length === 1) {
                this.classList.add('filled');
                if (index < otpInputs.length - 1) otpInputs[index + 1].focus();
            } else if (this.value.length === 0) {
                this.classList.remove('filled');
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                otpInputs[index - 1].focus();
                otpInputs[index - 1].classList.remove('filled');
            }
        });

        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
            if (pasted) {
                pasted.split('').forEach((d, i) => {
                    if (i < otpInputs.length) {
                        otpInputs[i].value = d;
                        otpInputs[i].classList.add('filled');
                    }
                });
                const next = Math.min(pasted.length, otpInputs.length - 1);
                otpInputs[next].focus();
            }
        });
        if (index === 0) input.focus();
    });

    function getOTP() {
        let otp = '';
        otpInputs.forEach(inp => otp += inp.value);
        return otp;
    }

    // ===== OTP Timer =====
    function startOtpTimer() {
        clearInterval(timerInterval);
        timeLeft = 120;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                timerCount.textContent = '0:00';
                timerCount.classList.add('warning');
                verifyOtpBtn.disabled = true;
                verifyOtpBtn.style.opacity = '0.5';
                showMessage(otpMessage, '⏱️ Nambari ya OTP imeisha muda. Tafadhali tumia "Tuma OTP tena".', 'error');
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerCount.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        if (timeLeft <= 10) timerCount.classList.add('warning');
        else timerCount.classList.remove('warning');
    }

    // ===== Resend OTP - FIXED using auth.resendResetOTP =====
    async function handleResendOtp() {
        if (isResending || resendCooldown > 0 || isVerified) return;
        
        isResending = true;
        // Store original HTML before modifying
        const originalBtnHtml = resendOtpBtn.innerHTML;
        resendOtpBtn.disabled = true;
        resendOtpBtn.innerHTML = `
            <span class="spinner" style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,0.1);border-top-color:#6c63ff;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:8px;"></span>
            Inatuma...
        `;

        try {
            // Use the dedicated resendResetOTP method
            const response = await auth.resendResetOTP(userEmail);
            
            if (response.success) {
                isResending = false;
                resendOtpBtn.innerHTML = originalBtnHtml;
                resendOtpBtn.disabled = false;
                
                clearInterval(timerInterval);
                startOtpTimer();
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.style.opacity = '1';
                hideMessage(otpMessage);
                
                otpInputs.forEach(inp => { 
                    inp.value = ''; 
                    inp.classList.remove('filled', 'error'); 
                });
                otpInputs[0].focus();
                
                showMessage(otpMessage, '✅ Nambari mpya ya OTP imetumwa!', 'success');
                setTimeout(() => hideMessage(otpMessage), 3000);
                
                startResendCooldown();
                resendOtpBtn.classList.add('pulse');
                setTimeout(() => resendOtpBtn.classList.remove('pulse'), 1500);
            } else {
                throw new Error(response.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            isResending = false;
            resendOtpBtn.innerHTML = originalBtnHtml;
            resendOtpBtn.disabled = false;
            showMessage(otpMessage, `❌ ${error.message || 'Tumeshindwa kutuma OTP. Tafadhali jaribu tena.'}`, 'error');
        }
    }

    function startResendCooldown() {
        resendCooldown = 30;
        updateResendBtn();
        clearInterval(resendCooldownInterval);
        resendCooldownInterval = setInterval(() => {
            resendCooldown--;
            updateResendBtn();
            if (resendCooldown <= 0) {
                clearInterval(resendCooldownInterval);
                resendCooldownInterval = null;
                resendOtpBtn.innerHTML = '📨 Tuma OTP tena';
                resendOtpBtn.disabled = false;
            }
        }, 1000);
    }

    function updateResendBtn() {
        if (resendCooldown > 0) {
            resendOtpBtn.innerHTML = `⏳ Subiri sekunde ${resendCooldown}`;
            resendOtpBtn.disabled = true;
        } else {
            resendOtpBtn.innerHTML = '📨 Tuma OTP tena';
            resendOtpBtn.disabled = false;
        }
    }

    resendOtpBtn.addEventListener('click', handleResendOtp);

    // ===== STEP 2: Verify OTP =====
    otpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isVerified) return;
        
        const otp = getOTP();
        
        if (otp.length < 6) {
            otpInputs.forEach((inp, idx) => { if (!inp.value) inp.classList.add('error'); });
            showMessage(otpMessage, '⚠️ Tafadhali jaza nambari zote sita.', 'error');
            return;
        }

        setButtonLoading(verifyOtpBtn, true, 'Inathibitisha...');

        try {
            const response = await auth.verifyForgotOTP(userEmail, otp);
            
            if (response.success && response.resetToken) {
                isVerified = true;
                resetToken = response.resetToken;
                showMessage(otpMessage, '✅ OTP sahihi! Nenda kwenye hatua inayofuata.', 'success');
                verifyOtpBtn.disabled = true;
                verifyOtpBtn.style.opacity = '0.5';
                otpInputs.forEach(inp => { inp.disabled = true; });
                clearInterval(timerInterval);
                
                setTimeout(() => {
                    showStep(3);
                    newPasswordInput.focus();
                }, 800);
            } else {
                throw new Error(response.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            otpInputs.forEach(inp => inp.classList.add('error'));
            showMessage(otpMessage, `❌ ${error.message || 'Nambari ya OTP si sahihi. Jaribu tena.'}`, 'error');
            setTimeout(() => {
                otpInputs.forEach(inp => { inp.value = ''; inp.classList.remove('filled', 'error'); });
                otpInputs[0].focus();
            }, 500);
            setButtonLoading(verifyOtpBtn, false);
        }
    });

    // ===== Back to email =====
    backToEmail.addEventListener('click', function(e) {
        e.preventDefault();
        clearInterval(timerInterval);
        clearInterval(resendCooldownInterval);
        isVerified = false;
        resetToken = '';
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.style.opacity = '1';
        otpInputs.forEach(inp => { inp.disabled = false; inp.value = ''; inp.classList.remove('filled', 'error'); });
        showStep(1);
        forgotEmail.value = userEmail || '';
        hideMessage(emailMessage);
    });

    // ===== STEP 3: Change Password =====
    document.querySelectorAll('#step3 .password-group').forEach(group => {
        const input = group.querySelector('input');
        const btn = group.querySelector('.visibility-toggle');
        if (btn && input) {
            btn.addEventListener('click', function() {
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                const label = btn.querySelector('.vis-label');
                if (label) label.textContent = isPass ? 'Ficha' : 'Onyesha';
                btn.classList.toggle('active', isPass);
            });
        }
    });

    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPass = newPasswordInput.value.trim();
        const confirmPass = confirmPasswordInput.value.trim();
        
        if (newPass.length < 8) {
            showMessage(passwordMessage, '⚠️ Nenosiri lazima liwe na angalau herufi 8.', 'error');
            return;
        }
        
        if (newPass !== confirmPass) {
            showMessage(passwordMessage, '⚠️ Nenosiri zote hazilingani. Jaribu tena.', 'error');
            return;
        }

        if (!resetToken) {
            showMessage(passwordMessage, '⚠️ Token ya reset haipatikani. Tafadhali anza tena.', 'error');
            return;
        }

        setButtonLoading(changePasswordBtn, true, 'Inabadilisha...');

        try {
            const response = await auth.resetPassword(resetToken, newPass, confirmPass);
            
            if (response.success) {
                showMessage(passwordMessage, '✅ Nenosiri limebadilishwa kwa mafanikio!', 'success');
                setButtonLoading(changePasswordBtn, false);
                changePasswordBtn.disabled = true;
                changePasswordBtn.textContent = '✅ Imefanikiwa';
                
                setTimeout(() => {
                    window.location.href = 'index.html?reset=1';
                }, 2000);
            } else {
                throw new Error(response.message || 'Password reset failed');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setButtonLoading(changePasswordBtn, false);
            showMessage(passwordMessage, `❌ ${error.message || 'Tumeshindwa kubadilisha nenosiri. Tafadhali jaribu tena.'}`, 'error');
        }
    });

    // ===== Init =====
    showStep(1);
    forgotEmail.value = '';

});