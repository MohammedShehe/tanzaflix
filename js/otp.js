// js/otp.js - OTP Verification Page

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    const otpInputs = document.querySelectorAll('.otp-input');
    const verifyBtn = document.getElementById('verifyBtn');
    const resendBtn = document.getElementById('resendBtn');
    const timerCount = document.getElementById('timerCount');
    const errorMessage = document.getElementById('otpErrorMessage');
    const successMessage = document.getElementById('otpSuccessMessage');
    const otpForm = document.getElementById('otpForm');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    // ===== 5 MINUTES (300 seconds) - MATCHES BACKEND =====
    const OTP_EXPIRY_SECONDS = 300;
    const RESEND_COOLDOWN_SECONDS = 30;

    let timerInterval = null;
    let timeLeft = OTP_EXPIRY_SECONDS;
    let isResending = false;
    let isVerified = false;
    let resendCooldown = 0;
    let resendCooldownInterval = null;
    let userEmail = '';

    function getUserEmail() {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        if (emailParam) {
            userEmail = emailParam;
            return emailParam;
        }

        try {
            const userData = localStorage.getItem('tanzaflix_user');
            if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed.email) {
                    userEmail = parsed.email;
                    return parsed.email;
                }
            }
        } catch (e) {}

        userEmail = 'admin@tanzaflix.com';
        return 'admin@tanzaflix.com';
    }

    const email = getUserEmail();
    if (userEmailDisplay) userEmailDisplay.textContent = email;

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
        }
        if (successMessage) successMessage.classList.remove('show');
    }

    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.classList.add('show');
        }
        if (errorMessage) errorMessage.classList.remove('show');
    }

    function hideMessages() {
        if (errorMessage) errorMessage.classList.remove('show');
        if (successMessage) successMessage.classList.remove('show');
    }

    // OTP Input Handling
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            const value = this.value;
            
            if (!/^\d*$/.test(value)) {
                this.value = value.replace(/\D/g, '');
                return;
            }

            this.classList.remove('error');
            hideMessages();

            if (value.length === 1) {
                this.classList.add('filled');
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            } else if (value.length === 0) {
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
            const pastedData = (e.clipboardData || window.clipboardData).getData('text');
            const digits = pastedData.replace(/\D/g, '').slice(0, otpInputs.length);
            
            if (digits) {
                const digitArray = digits.split('');
                otpInputs.forEach((inp, idx) => {
                    if (idx < digitArray.length) {
                        inp.value = digitArray[idx];
                        inp.classList.add('filled');
                    } else {
                        inp.value = '';
                        inp.classList.remove('filled');
                    }
                });
                const nextIndex = Math.min(digitArray.length, otpInputs.length - 1);
                otpInputs[nextIndex].focus();
            }
        });

        if (index === 0) {
            input.focus();
        }
    });

    function getOTP() {
        let otp = '';
        otpInputs.forEach(input => {
            otp += input.value;
        });
        return otp;
    }

    // Timer Functions - 5 minutes
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = OTP_EXPIRY_SECONDS;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                if (timerCount) {
                    timerCount.textContent = '0:00';
                    timerCount.classList.add('warning');
                }
                if (verifyBtn) {
                    verifyBtn.disabled = true;
                    verifyBtn.style.opacity = '0.5';
                }
                showError('⏱️ Nambari ya OTP imeisha muda. Tafadhali tumia "Tuma OTP tena".');
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        if (!timerCount) return;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerCount.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30) {
            timerCount.classList.add('warning');
        } else {
            timerCount.classList.remove('warning');
        }
    }

    // ===== RESEND OTP - FIXED =====
    async function handleResendOTP() {
        if (isResending || resendCooldown > 0 || isVerified) return;
        if (!resendBtn) return;

        isResending = true;
        const originalHtml = resendBtn.innerHTML;
        resendBtn.disabled = true;
        resendBtn.innerHTML = '⏳ Inatuma...';

        try {
            // Use the resend-login-otp endpoint for admin login OTP
            const response = await fetch(`${api.baseUrl}/auth/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail })
            });
            
            const data = await response.json();

            if (data.success) {
                isResending = false;
                resendBtn.innerHTML = originalHtml;
                resendBtn.disabled = false;

                // Reset timer to 5 minutes (300 seconds)
                clearInterval(timerInterval);
                startTimer();
                if (verifyBtn) {
                    verifyBtn.disabled = false;
                    verifyBtn.style.opacity = '1';
                }

                hideMessages();
                otpInputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('filled', 'error');
                });
                otpInputs[0].focus();

                showSuccess('✅ Nambari mpya ya OTP imetumwa kwa barua pepe yako!');
                setTimeout(() => hideMessages(), 3000);

                startResendCooldown();
                if (resendBtn) {
                    resendBtn.classList.add('pulse');
                    setTimeout(() => resendBtn.classList.remove('pulse'), 1500);
                }
            } else {
                throw new Error(data.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            isResending = false;
            resendBtn.innerHTML = originalHtml;
            resendBtn.disabled = false;
            showError(`❌ ${error.message || 'Tumeshindwa kutuma OTP. Tafadhali jaribu tena.'}`);
        }
    }

    function startResendCooldown() {
        resendCooldown = RESEND_COOLDOWN_SECONDS;
        updateResendButton();

        clearInterval(resendCooldownInterval);
        resendCooldownInterval = setInterval(() => {
            resendCooldown--;
            updateResendButton();

            if (resendCooldown <= 0) {
                clearInterval(resendCooldownInterval);
                resendCooldownInterval = null;
                resendBtn.innerHTML = '📨 Tuma OTP tena';
                resendBtn.disabled = false;
            }
        }, 1000);
    }

    function updateResendButton() {
        if (!resendBtn) return;
        if (resendCooldown > 0) {
            resendBtn.innerHTML = `⏳ Subiri sekunde ${resendCooldown}`;
            resendBtn.disabled = true;
        } else {
            resendBtn.innerHTML = '📨 Tuma OTP tena';
            resendBtn.disabled = false;
        }
    }

    // Verify OTP
    async function handleVerifyOTP(e) {
        e.preventDefault();

        if (isVerified) return;
        if (!verifyBtn) return;

        const otp = getOTP();

        const allFilled = otp.length === otpInputs.length;
        if (!allFilled) {
            otpInputs.forEach((input, index) => {
                if (!input.value) {
                    input.classList.add('error');
                    if (index === 0) input.focus();
                }
            });
            showError('⚠️ Tafadhali jaza nambari zote sita za OTP.');
            return;
        }

        const originalVerifyHtml = verifyBtn.innerHTML;
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '⏳ Inathibitisha...';

        try {
            const response = await auth.verifyOTP(email, otp);
            
            if (response.success) {
                isVerified = true;
                hideMessages();
                showSuccess('✅ Uthibitishaji umefanikiwa! Unaelekezwa...');
                
                otpInputs.forEach(input => {
                    input.disabled = true;
                    input.style.cursor = 'not-allowed';
                });
                if (verifyBtn) verifyBtn.disabled = true;
                if (resendBtn) resendBtn.disabled = true;
                clearInterval(timerInterval);

                localStorage.setItem('tanzaflix_admin_session', 'true');

                setTimeout(() => {
                    window.location.href = 'admin.html?verified=1';
                }, 2000);
            } else {
                throw new Error(response.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            otpInputs.forEach(input => {
                input.classList.add('error');
                input.value = '';
                input.classList.remove('filled');
            });
            otpInputs[0].focus();
            showError(`❌ ${error.message || 'Nambari ya OTP si sahihi. Tafadhali jaribu tena.'}`);

            const group = document.getElementById('otpInputGroup');
            if (group) {
                group.style.animation = 'none';
                setTimeout(() => {
                    group.style.animation = 'shake 0.5s ease';
                }, 10);
                setTimeout(() => {
                    group.style.animation = '';
                }, 500);
            }

            verifyBtn.innerHTML = originalVerifyHtml;
            verifyBtn.disabled = false;
        }
    }

    if (otpForm) {
        otpForm.addEventListener('submit', handleVerifyOTP);
    }
    
    if (resendBtn) {
        resendBtn.addEventListener('click', handleResendOTP);
    }

    startTimer();

    try {
        const userData = localStorage.getItem('tanzaflix_user');
        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.isAdmin && parsed.token) {
                window.location.href = 'admin.html';
                return;
            }
        }
    } catch (e) {}

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && !timerInterval && timeLeft > 0) {
            startTimer();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('otp-input')) {
            e.preventDefault();
            if (otpForm) otpForm.dispatchEvent(new Event('submit'));
        }
    });

    window.addEventListener('beforeunload', function() {
        clearInterval(timerInterval);
        clearInterval(resendCooldownInterval);
    });

    console.log('🔐 OTP Page initialized');
    console.log(`📧 Email: ${email}`);
    console.log(`⏱️ OTP expires in ${OTP_EXPIRY_SECONDS / 60} minutes (${OTP_EXPIRY_SECONDS} seconds)`);
});