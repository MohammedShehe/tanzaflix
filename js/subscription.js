// js/subscription.js - Subscription Page with Proper Error Handling

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!auth.checkAuth()) return;

    // ===== DOM Elements =====
    const planCards = document.querySelectorAll('.plan-card');
    const plansGrid = document.getElementById('plansGrid');
    const paymentSection = document.getElementById('paymentSection');
    const paymentForm = document.getElementById('paymentForm');
    const cancelBtn = document.getElementById('cancelPlanBtn');
    const selectedPlanName = document.getElementById('selectedPlanName');
    const selectedPlanPrice = document.getElementById('selectedPlanPrice');
    const payNowBtn = document.getElementById('payNowBtn');
    const paymentProcessing = document.getElementById('paymentProcessing');
    const paymentSuccess = document.getElementById('paymentSuccess');
    const activeBanner = document.getElementById('activeSubscriptionBanner');
    const subscriptionDetails = document.getElementById('subscriptionDetails');
    const paymentMethod = document.getElementById('paymentMethod');
    const phoneField = document.getElementById('phoneField');
    const cardFields = document.getElementById('cardFields');
    const phoneInput = document.getElementById('phoneNumber');

    // ===== Error Message Container =====
    const errorContainer = document.createElement('div');
    errorContainer.id = 'paymentError';
    errorContainer.style.cssText = `
        display: none;
        padding: 1rem 1.2rem;
        border-radius: var(--radius-md);
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #f87171;
        margin: 1rem 0;
        font-size: 0.9rem;
        line-height: 1.6;
        animation: fadeSlideIn 0.3s ease;
    `;
    paymentForm.insertBefore(errorContainer, paymentForm.querySelector('#planSummary'));

    let selectedPlan = null;
    let selectedPlanId = null;
    let selectedPlanData = null;
    let currentSubscription = null;
    let plansData = [];

    // ===== Error Display Function =====
    function showError(message, type = 'error') {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        errorContainer.style.background = type === 'warning' 
            ? 'rgba(251, 191, 36, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)';
        errorContainer.style.borderColor = type === 'warning'
            ? 'rgba(251, 191, 36, 0.2)'
            : 'rgba(239, 68, 68, 0.2)';
        errorContainer.style.color = type === 'warning' ? '#fbbf24' : '#f87171';
        
        // Auto-hide after 8 seconds
        clearTimeout(errorContainer._hideTimer);
        errorContainer._hideTimer = setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 8000);
    }

    function hideError() {
        errorContainer.style.display = 'none';
        clearTimeout(errorContainer._hideTimer);
    }

    // ===== Toggle Payment Fields Based on Method =====
    function togglePaymentFields() {
        const method = paymentMethod.value;
        
        if (method === 'Card') {
            phoneField.style.display = 'none';
            cardFields.classList.add('visible');
            phoneInput.removeAttribute('required');
        } else if (method === '') {
            phoneField.style.display = 'block';
            cardFields.classList.remove('visible');
            phoneInput.removeAttribute('required');
        } else {
            phoneField.style.display = 'block';
            cardFields.classList.remove('visible');
            phoneInput.setAttribute('required', 'required');
        }
        hideError();
    }

    paymentMethod.addEventListener('change', togglePaymentFields);

    // ===== Check Current Subscription =====
    function checkCurrentSubscription() {
        try {
            const subData = localStorage.getItem('tanzaflix_subscription');
            if (subData) {
                const sub = JSON.parse(subData);
                if (sub.isSubscribed && new Date(sub.expiryDate) > new Date()) {
                    currentSubscription = sub;
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    // ===== Render Active Subscription Banner =====
    function renderActiveSubscription() {
        if (!currentSubscription) {
            activeBanner.classList.remove('show');
            return;
        }

        activeBanner.classList.add('show');
        
        const expiryDate = new Date(currentSubscription.expiryDate);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
        
        subscriptionDetails.innerHTML = `
            <div class="detail-item">
                <span class="label">Mpango</span>
                <span class="value">${currentSubscription.planName || currentSubscription.plan || 'Active'}</span>
            </div>
            <div class="detail-item">
                <span class="label">Bei</span>
                <span class="value">${currentSubscription.planPrice || 'TSh 0'}</span>
            </div>
            <div class="detail-item">
                <span class="label">Inaisha</span>
                <span class="value">${expiryDate.toLocaleDateString('sw', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div class="detail-item">
                <span class="label">Siku Zilizobaki</span>
                <span class="value ${daysLeft < 7 ? 'expiry-warning' : ''}">
                    ${daysLeft} siku
                    ${daysLeft < 7 ? '⚠️ Inakaribia kuisha!' : ''}
                </span>
            </div>
        `;
    }

    // ===== Load Plans from API =====
    async function loadPlans() {
        try {
            const response = await api.getPlans();
            
            if (response.success && response.plans) {
                plansData = response.plans;
                
                const templateCard = planCards[0];
                plansGrid.innerHTML = '';
                
                plansData.forEach((plan) => {
                    const card = templateCard.cloneNode(true);
                    
                    const priceEl = card.querySelector('.plan-price');
                    const nameEl = card.querySelector('h3');
                    const features = card.querySelectorAll('.plan-features li');
                    const btn = card.querySelector('.plan-select-btn');
                    
                    if (nameEl) nameEl.textContent = plan.name;
                    
                    if (priceEl) {
                        const durationLabel = plan.duration_days === 1 ? 'siku' : 
                                            plan.duration_days === 7 ? 'wiki' : 
                                            plan.duration_days === 30 ? 'mwezi' : 'mwaka';
                        priceEl.innerHTML = `TSh ${plan.price.toLocaleString()}<span>/${durationLabel}</span>`;
                    }
                    
                    if (features.length > 0) {
                        const featureTexts = [
                            '✓ Ufikiaji wa filamu zote',
                            plan.duration_days >= 7 ? '✓ Ubora wa HD' : '✓ Ubora wa SD',
                            plan.duration_days >= 30 ? '✓ Onyesha kwenye kifaa 4' : plan.duration_days >= 7 ? '✓ Onyesha kwenye kifaa 2' : '✓ Onyesha kwenye kifaa 1',
                            '✓ Ghairi wakati wowote',
                            plan.duration_days >= 30 ? '✓ Hakuna matangazo' : '',
                            plan.duration_days >= 365 ? '✓ Pakua ili utazame nje ya mtandao' : '',
                            plan.duration_days >= 365 ? '✓ Ufikiaji wa mapema wa filamu mpya' : '',
                        ].filter(t => t);
                        
                        features.forEach((li, i) => {
                            if (i < featureTexts.length) {
                                li.textContent = featureTexts[i];
                            }
                        });
                    }
                    
                    card.dataset.planId = plan.id;
                    card.dataset.planName = plan.name;
                    card.dataset.planPrice = `TSh ${plan.price.toLocaleString()}`;
                    card.dataset.planAmount = plan.price;
                    
                    if (currentSubscription && currentSubscription.planId === plan.id) {
                        card.classList.add('subscribed');
                        const badge = document.createElement('span');
                        badge.className = 'plan-badge-subscribed';
                        badge.textContent = '✅ Unatumia';
                        card.appendChild(badge);
                        
                        if (btn) {
                            btn.textContent = '✅ Inatumika';
                            btn.disabled = true;
                        }
                    }
                    
                    if (btn) {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            if (this.disabled) return;
                            const planId = parseInt(card.dataset.planId);
                            selectPlan(planId, card);
                        });
                    }
                    
                    card.addEventListener('click', function() {
                        if (this.classList.contains('subscribed')) return;
                        const planId = parseInt(this.dataset.planId);
                        selectPlan(planId, this);
                    });
                    
                    plansGrid.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error loading plans:', error);
            showError('⚠️ Hatukuweza kupakia mipango ya usajili. Tafadhali jaribu tena baadaye.', 'error');
        }
    }

    // ===== Plan Selection =====
    function selectPlan(planId, card) {
        if (card.classList.contains('subscribed')) {
            showError('✅ Tayari una usajili huu. Unaweza kuongeza mpango mwingine kwa kutumia kitufe cha "Ongeza Usajili".', 'warning');
            return;
        }
        
        const planName = card.dataset.planName || card.querySelector('h3').textContent;
        const planPrice = card.dataset.planPrice || card.querySelector('.plan-price').textContent.trim();
        const planAmount = parseFloat(card.dataset.planAmount) || 0;
        
        selectedPlan = planName;
        selectedPlanId = planId;
        selectedPlanData = {
            name: planName,
            price: planPrice,
            amount: planAmount
        };
        
        selectedPlanName.textContent = planName;
        selectedPlanPrice.textContent = planPrice;
        
        paymentProcessing.style.display = 'none';
        paymentSuccess.style.display = 'none';
        payNowBtn.style.display = 'block';
        payNowBtn.disabled = false;
        payNowBtn.textContent = 'Maliza Usajili';
        payNowBtn.style.background = '';
        hideError();
        
        paymentSection.classList.remove('hidden');
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        // Reset payment method selection
        paymentMethod.value = '';
        togglePaymentFields();
    }

    // ===== Cancel Plan Selection =====
    cancelBtn.addEventListener('click', function() {
        paymentSection.classList.add('hidden');
        document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
        selectedPlan = null;
        selectedPlanId = null;
        selectedPlanData = null;
        paymentProcessing.style.display = 'none';
        paymentSuccess.style.display = 'none';
        payNowBtn.style.display = 'block';
        payNowBtn.disabled = false;
        payNowBtn.textContent = 'Maliza Usajili';
        hideError();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== Payment Form Submission with Proper Error Messages =====
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();

        // ===== 1. FRONTEND VALIDATION ERRORS =====
        if (!selectedPlanId || !selectedPlanData) {
            showError('⚠️ Tafadhali chagua mpango wa usajili kwanza.', 'error');
            return;
        }

        const method = paymentMethod.value;
        if (!method) {
            showError('⚠️ Tafadhali chagua njia ya malipo.', 'error');
            return;
        }

        // Map frontend method names to backend values
        let backendMethod;
        let phone = '';
        let cardData = null;

        // ===== CARD PAYMENT =====
        if (method === 'Card') {
            backendMethod = 'bank_card';
            
            const cardNumber = document.getElementById('cardNumber').value.trim();
            const cardHolderName = document.getElementById('cardHolderName').value.trim();
            const cardExpiry = document.getElementById('cardExpiry').value.trim();
            const cardCvv = document.getElementById('cardCvv').value.trim();

            if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
                showError('⚠️ Tafadhali ingiza namba halali ya kadi (tarakimu 16).', 'error');
                return;
            }

            if (!cardHolderName || cardHolderName.length < 3) {
                showError('⚠️ Tafadhali ingiza jina kwenye kadi.', 'error');
                return;
            }

            if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
                showError('⚠️ Tafadhali ingiza tarehe ya kuisha kwa muundo MM/YY.', 'error');
                return;
            }

            if (!cardCvv || cardCvv.length < 3) {
                showError('⚠️ Tafadhali ingiza CVV halali (tarakimu 3-4).', 'error');
                return;
            }

            // Prepare card data for backend
            cardData = {
                accountName: cardHolderName,
                cardNumber: cardNumber.replace(/\s/g, ''),
                expiryDate: cardExpiry.replace(/\s/g, ''),
                cvv: cardCvv
            };
            
            // No phone needed for card
            phone = '';

        // ===== MOBILE MONEY PAYMENT =====
        } else {
            // Map frontend mobile money names to backend
            if (method === 'M-Pesa') {
                backendMethod = 'mpesa';
            } else if (method === 'Airtel Money') {
                backendMethod = 'airtel_money';
            } else if (method === 'Tigo Pesa') {
                backendMethod = 'mix_by_yas';
            } else {
                backendMethod = method.toLowerCase();
            }

            phone = phoneInput.value.trim();
            if (!phone || phone.length < 9) {
                showError('⚠️ Tafadhali ingiza namba halali ya simu (angalau tarakimu 9).', 'error');
                return;
            }
        }

        // ===== 2. SHOW PROCESSING STATE =====
        paymentProcessing.style.display = 'block';
        payNowBtn.style.display = 'none';
        payNowBtn.disabled = true;
        hideError();

        try {
            // ===== 3. SEND PAYMENT REQUEST =====
            const response = await api.createPayment(
                selectedPlanId, 
                backendMethod, 
                phone, 
                cardData
            );
            
            if (response.success) {
                const reference = response.reference;
                
                // Show initial success message
                showError('✅ Malipo yameanzishwa! Tunasubiri uthibitisho...', 'warning');
                
                // ===== 4. POLL FOR PAYMENT STATUS =====
                let attempts = 0;
                const maxAttempts = 36; // 3 minutes (5 seconds * 36)
                
                const checkStatus = setInterval(async () => {
                    attempts++;
                    
                    try {
                        const statusRes = await api.getPaymentStatus(reference);
                        
                        if (statusRes.success && statusRes.payment.status === 'paid') {
                            clearInterval(checkStatus);
                            
                            paymentProcessing.style.display = 'none';
                            paymentSuccess.style.display = 'block';
                            hideError();
                            
                            // Save subscription data
                            const subscriptionData = {
                                phone: phone || 'Card Payment',
                                plan: selectedPlan,
                                planId: selectedPlanId,
                                planName: selectedPlan,
                                planPrice: selectedPlanData.price,
                                planAmount: selectedPlanData.amount,
                                paymentMethod: method,
                                subscriptionDate: new Date().toISOString(),
                                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                isSubscribed: true,
                                paymentStatus: 'confirmed',
                                reference: reference
                            };
                            
                            localStorage.setItem('tanzaflix_subscription', JSON.stringify(subscriptionData));
                            
                            try {
                                const user = auth.getUser() || {};
                                user.isSubscribed = true;
                                user.plan = selectedPlan;
                                user.planName = selectedPlan;
                                user.planPrice = selectedPlanData.price;
                                user.planAmount = selectedPlanData.amount;
                                localStorage.setItem('tanzaflix_user', JSON.stringify(user));
                            } catch (err) {
                                console.warn('Error updating user data:', err);
                            }
                            
                            payNowBtn.textContent = '✅ Imefanikiwa!';
                            payNowBtn.style.display = 'block';
                            payNowBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                            
                            setTimeout(() => {
                                window.location.href = 'dashboard.html?subscription=success';
                            }, 2500);
                            
                        } else if (statusRes.success && statusRes.payment.status === 'failed') {
                            clearInterval(checkStatus);
                            paymentProcessing.style.display = 'none';
                            payNowBtn.style.display = 'block';
                            payNowBtn.disabled = false;
                            payNowBtn.textContent = 'Jaribu tena';
                            
                            showError('❌ Malipo yameshindwa. Tafadhali hakikisha una fedha za kutosha kwenye akaunti yako na jaribu tena.', 'error');
                            
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkStatus);
                            paymentProcessing.style.display = 'none';
                            payNowBtn.style.display = 'block';
                            payNowBtn.disabled = false;
                            payNowBtn.textContent = 'Jaribu tena';
                            
                            showError('⏱️ Muda wa malipo umeisha. Hakuna kiasi kilichotolewa kutoka akaunti yako. Tafadhali jaribu tena.', 'error');
                        }
                    } catch (e) {
                        console.warn('Status check failed:', e);
                        if (attempts >= maxAttempts) {
                            clearInterval(checkStatus);
                            paymentProcessing.style.display = 'none';
                            payNowBtn.style.display = 'block';
                            payNowBtn.disabled = false;
                            payNowBtn.textContent = 'Jaribu tena';
                            
                            showError('⏱️ Muda wa malipo umeisha. Hakuna kiasi kilichotolewa kutoka akaunti yako. Tafadhali jaribu tena.', 'error');
                        }
                    }
                }, 5000);
                
            } else {
                // ===== 5. BACKEND REJECTED THE PAYMENT =====
                paymentProcessing.style.display = 'none';
                payNowBtn.style.display = 'block';
                payNowBtn.disabled = false;
                payNowBtn.textContent = 'Jaribu tena';
                
                if (response.message) {
                    showError(`❌ ${response.message}`, 'error');
                } else {
                    showError('❌ Malipo yameshindwa. Tafadhali jaribu tena baadaye.', 'error');
                }
            }
            
        } catch (error) {
            // ===== 6. NETWORK / CONNECTION ERRORS =====
            console.error('Payment error:', error);
            paymentProcessing.style.display = 'none';
            payNowBtn.style.display = 'block';
            payNowBtn.disabled = false;
            payNowBtn.textContent = 'Jaribu tena';
            
            // Differentiate between network errors and server errors
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                showError('🌐 Tatizo la muunganisho wa mtandao. Hakikisha umeunganishwa kwenye intaneti na jaribu tena. Hakuna kiasi kilichotolewa.', 'error');
            } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
                showError('⚠️ Tatizo la kiufundi kwenye server yetu. Tafadhali jaribu tena baada ya muda. Hakuna kiasi kilichotolewa.', 'error');
            } else if (error.message.includes('bank card') || error.message.includes('Card')) {
                showError(`💳 ${error.message}`, 'error');
            } else {
                showError(`❌ ${error.message || 'Malipo yameshindwa. Tafadhali jaribu tena.'}`, 'error');
            }
        }
    });

    // ===== Add More Subscription =====
    document.getElementById('upgradeBtn').addEventListener('click', function() {
        if (confirm('Je, una uhakika unataka kuongeza mpango mwingine wa usajili?')) {
            document.querySelector('.plans-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelector('.plans-grid').style.animation = 'none';
            setTimeout(() => {
                document.querySelector('.plans-grid').style.animation = 'fadeSlideIn 0.4s ease';
            }, 10);
        }
    });

    // ===== Initialize =====
    const hasSubscription = checkCurrentSubscription();
    await loadPlans();
    
    if (hasSubscription) {
        renderActiveSubscription();
    }

    togglePaymentFields();

    console.log('💰 TanzaFlix Subscription page loaded');
    console.log(hasSubscription ? '✅ User has active subscription' : '👤 User is not subscribed');
});