// js/subscription.js - Subscription Page with Cancellation Support

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
    const cancelSubscriptionBtn = document.getElementById('cancelSubscriptionBtn');
    const cancelReason = document.getElementById('cancelReason');
    const cancelModal = document.getElementById('cancelModal');

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
    let subscriptionStatus = null;

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
            // Silent fail
        }
        return false;
    }

    // ===== Fetch Subscription Status from API =====
    async function fetchSubscriptionStatus() {
        try {
            const response = await api.getSubscriptionStatus();
            if (response.success) {
                subscriptionStatus = response;
                if (response.subscription) {
                    const subData = {
                        isSubscribed: response.subscription.is_active,
                        planId: response.subscription.plan_id,
                        planName: response.subscription.plan_name,
                        planPrice: `TSh ${response.subscription.price?.toLocaleString()}`,
                        planAmount: response.subscription.price,
                        expiryDate: response.subscription.expires_at,
                        status: response.subscription.status,
                        daysRemaining: response.subscription.days_remaining,
                        cancellation: response.subscription.cancellation
                    };
                    localStorage.setItem('tanzaflix_subscription', JSON.stringify(subData));
                    currentSubscription = subData;
                }
                return response;
            }
        } catch (error) {
            // Silent fail
        }
        return null;
    }

    // ===== Render Active Subscription Banner =====
    function renderActiveSubscription() {
        if (!currentSubscription || !currentSubscription.isSubscribed) {
            activeBanner.classList.remove('show');
            return;
        }

        activeBanner.classList.add('show');
        
        const expiryDate = new Date(currentSubscription.expiryDate);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
        
        const isCancelling = currentSubscription.status === 'cancelling' || 
                            (currentSubscription.cancellation && currentSubscription.cancellation.status === 'pending');
        
        let statusText = 'Inatumika ✅';
        let statusClass = '';
        
        if (isCancelling) {
            statusText = 'Inaghairiwa ⏳';
            statusClass = 'status-cancelling';
        } else if (daysLeft < 7) {
            statusText = `Inaisha hivi karibuni ⚠️`;
            statusClass = 'status-expiring';
        }
        
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
                <span class="label">Hali</span>
                <span class="value ${statusClass}">${statusText}</span>
            </div>
            <div class="detail-item">
                <span class="label">Inaisha</span>
                <span class="value ${daysLeft < 7 ? 'expiry-warning' : ''}">
                    ${expiryDate.toLocaleDateString('sw', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>
            <div class="detail-item">
                <span class="label">Siku Zilizobaki</span>
                <span class="value ${daysLeft < 7 ? 'expiry-warning' : ''}">
                    ${daysLeft} siku
                    ${daysLeft < 7 ? '⚠️ Inakaribia kuisha!' : ''}
                </span>
            </div>
        `;

        if (cancelSubscriptionBtn) {
            if (isCancelling) {
                cancelSubscriptionBtn.textContent = '⏳ Ombi la Kughairi Limetumwa';
                cancelSubscriptionBtn.disabled = true;
                cancelSubscriptionBtn.style.opacity = '0.6';
                cancelSubscriptionBtn.style.cursor = 'not-allowed';
            } else if (daysLeft > 0) {
                cancelSubscriptionBtn.textContent = '❌ Ghairi Usajili';
                cancelSubscriptionBtn.disabled = false;
                cancelSubscriptionBtn.style.opacity = '1';
                cancelSubscriptionBtn.style.cursor = 'pointer';
            } else {
                cancelSubscriptionBtn.textContent = '❌ Usajili Umeisha';
                cancelSubscriptionBtn.disabled = true;
                cancelSubscriptionBtn.style.opacity = '0.6';
                cancelSubscriptionBtn.style.cursor = 'not-allowed';
            }
        }
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
                    
                    if (currentSubscription && currentSubscription.planId === plan.id && currentSubscription.isSubscribed) {
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

    // ===== CANCEL SUBSCRIPTION =====
    if (cancelSubscriptionBtn) {
        cancelSubscriptionBtn.addEventListener('click', function() {
            if (this.disabled) return;
            
            if (cancelModal) {
                cancelModal.classList.add('active');
                cancelModal.style.display = 'flex';
                if (cancelReason) cancelReason.value = '';
            }
        });
    }

    // ===== Confirm Cancellation =====
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', async function() {
            const btn = this;
            const reason = cancelReason ? cancelReason.value.trim() : '';
            
            setButtonLoading(btn, true, 'Inaghairi...');
            
            try {
                const response = await api.cancelSubscription(reason || undefined);
                
                setButtonLoading(btn, false);
                
                if (response.success) {
                    if (cancelModal) {
                        cancelModal.classList.remove('active');
                        cancelModal.style.display = 'none';
                    }
                    
                    showToast('✅ Usajili umeghairiwa. Utapata ufikiaji hadi mwisho wa kipindi chako.', 'warning');
                    
                    await fetchSubscriptionStatus();
                    renderActiveSubscription();
                    
                    if (cancelSubscriptionBtn) {
                        cancelSubscriptionBtn.textContent = '⏳ Ombi la Kughairi Limetumwa';
                        cancelSubscriptionBtn.disabled = true;
                        cancelSubscriptionBtn.style.opacity = '0.6';
                        cancelSubscriptionBtn.style.cursor = 'not-allowed';
                    }
                } else {
                    alert(`❌ ${response.message || 'Imeshindwa kughairi usajili'}`);
                }
            } catch (error) {
                setButtonLoading(btn, false);
                alert(`❌ Error: ${error.message}`);
            }
        });
    }

    // ===== Close Cancel Modal =====
    const closeCancelModal = document.getElementById('closeCancelModal');
    if (closeCancelModal) {
        closeCancelModal.addEventListener('click', function() {
            if (cancelModal) {
                cancelModal.classList.remove('active');
                cancelModal.style.display = 'none';
            }
        });
    }

    // ===== Payment Form Submission =====
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();

        if (!selectedPlanId || !selectedPlanData) {
            showError('⚠️ Tafadhali chagua mpango wa usajili kwanza.', 'error');
            return;
        }

        const method = paymentMethod.value;
        if (!method) {
            showError('⚠️ Tafadhali chagua njia ya malipo.', 'error');
            return;
        }

        let backendMethod;
        let phone = '';
        let cardData = null;

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

            cardData = {
                accountName: cardHolderName,
                cardNumber: cardNumber.replace(/\s/g, ''),
                expiryDate: cardExpiry.replace(/\s/g, ''),
                cvv: cardCvv
            };
            
            phone = '';

        } else {
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

        paymentProcessing.style.display = 'block';
        payNowBtn.style.display = 'none';
        payNowBtn.disabled = true;
        hideError();

        try {
            const response = await api.createPayment(
                selectedPlanId, 
                backendMethod, 
                phone, 
                cardData
            );
            
            if (response.success) {
                const reference = response.reference;
                
                showError('✅ Malipo yameanzishwa! Tunasubiri uthibitisho...', 'warning');
                
                let attempts = 0;
                const maxAttempts = 36;
                
                const checkStatus = setInterval(async () => {
                    attempts++;
                    
                    try {
                        const statusRes = await api.getPaymentStatus(reference);
                        
                        if (statusRes.success && statusRes.payment.status === 'paid') {
                            clearInterval(checkStatus);
                            
                            paymentProcessing.style.display = 'none';
                            paymentSuccess.style.display = 'block';
                            hideError();
                            
                            await fetchSubscriptionStatus();
                            renderActiveSubscription();
                            
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
            paymentProcessing.style.display = 'none';
            payNowBtn.style.display = 'block';
            payNowBtn.disabled = false;
            payNowBtn.textContent = 'Jaribu tena';
            
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
        document.querySelector('.plans-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelector('.plans-grid').style.animation = 'none';
        setTimeout(() => {
            document.querySelector('.plans-grid').style.animation = 'fadeSlideIn 0.4s ease';
        }, 10);
    });

    // ===== Set Button Loading State =====
    function setButtonLoading(button, isLoading, loadingText = 'Inapakia...') {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            if (!button.dataset.originalHtml) {
                button.dataset.originalHtml = button.innerHTML;
            }
            button.innerHTML = loadingText;
            button.classList.add('btn-loading');
        } else {
            button.disabled = false;
            button.classList.remove('btn-loading');
            if (button.dataset.originalHtml) {
                button.innerHTML = button.dataset.originalHtml;
                delete button.dataset.originalHtml;
            }
        }
    }

    // ===== Show Toast Notification =====
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            background: ${type === 'warning' ? 'rgba(251, 191, 36, 0.95)' : 'rgba(34, 197, 94, 0.95)'};
            color: #0a0a1a;
            font-weight: 600;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            z-index: 999;
            animation: fadeSlideIn 0.4s ease;
            max-width: 400px;
            backdrop-filter: blur(10px);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.4s ease';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // ===== Initialize =====
    await fetchSubscriptionStatus();
    
    const hasSubscription = currentSubscription && currentSubscription.isSubscribed;
    await loadPlans();
    
    if (hasSubscription) {
        renderActiveSubscription();
    }

    togglePaymentFields();
});