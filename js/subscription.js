document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM Elements =====
    const planCards = document.querySelectorAll('.plan-card');
    const paymentSection = document.getElementById('paymentSection');
    const paymentForm = document.getElementById('paymentForm');
    const cancelBtn = document.getElementById('cancelPlanBtn');
    const selectedPlanName = document.getElementById('selectedPlanName');
    const selectedPlanPrice = document.getElementById('selectedPlanPrice');
    const payNowBtn = document.getElementById('payNowBtn');
    const paymentProcessing = document.getElementById('paymentProcessing');
    const paymentSuccess = document.getElementById('paymentSuccess');

    // ===== Plan Data =====
    const plans = {
        daily: { name: 'Kila Siku', price: 'TSh 5,000', amount: 5000 },
        weekly: { name: 'Kila Wiki', price: 'TSh 8,000', amount: 8000 },
        monthly: { name: 'Kila Mwezi', price: 'TSh 15,000', amount: 15000 },
        yearly: { name: 'Kila Mwaka', price: 'TSh 80,000', amount: 80000 }
    };

    let selectedPlan = null;

    // ===== Plan Selection =====
    planCards.forEach(card => {
        const btn = card.querySelector('.plan-select-btn');
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const plan = this.dataset.plan;
            if (plan && plans[plan]) {
                selectedPlan = plan;
                selectedPlanName.textContent = plans[plan].name;
                selectedPlanPrice.textContent = plans[plan].price;
                
                // Reset payment states
                paymentProcessing.style.display = 'none';
                paymentSuccess.style.display = 'none';
                payNowBtn.style.display = 'block';
                payNowBtn.disabled = false;
                payNowBtn.textContent = 'Maliza Usajili';
                
                paymentSection.classList.remove('hidden');
                paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Highlight selected plan
                planCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            }
        });
    });

    // ===== Cancel Plan Selection =====
    cancelBtn.addEventListener('click', function() {
        paymentSection.classList.add('hidden');
        planCards.forEach(c => c.classList.remove('selected'));
        selectedPlan = null;
        // Reset payment states
        paymentProcessing.style.display = 'none';
        paymentSuccess.style.display = 'none';
        payNowBtn.style.display = 'block';
        payNowBtn.disabled = false;
        payNowBtn.textContent = 'Maliza Usajili';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== Real Payment Flow Simulation =====
    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const method = document.getElementById('paymentMethod').value;
        const phone = document.getElementById('phoneNumber').value.trim();
        const name = document.getElementById('fullName').value.trim();
        const idNumber = document.getElementById('idNumber').value.trim();
        const email = document.getElementById('emailAddress').value.trim();

        // Validation
        if (!selectedPlan) {
            alert('Tafadhali chagua mpango wa usajili kwanza.');
            return;
        }

        if (!method) {
            alert('Tafadhali chagua njia ya malipo.');
            return;
        }

        if (!phone || phone.length < 9) {
            alert('Tafadhali ingiza namba halali ya simu.');
            return;
        }

        if (!name || name.length < 3) {
            alert('Tafadhali ingiza jina lako kamili.');
            return;
        }

        // Show processing state
        paymentProcessing.style.display = 'block';
        payNowBtn.style.display = 'none';
        payNowBtn.disabled = true;

        // ===== SIMULATE PAYMENT PROCESSING =====
        // In a real app, this would be an API call to a payment gateway
        // like M-Pesa API, Airtel Money API, or a payment processor
        setTimeout(() => {
            // Hide processing
            paymentProcessing.style.display = 'none';

            // Show success
            paymentSuccess.style.display = 'block';
            
            // Save subscription data
            const planData = plans[selectedPlan];
            const subscriptionData = {
                name: name,
                email: email || name.toLowerCase().replace(/\s/g, '.') + '@tanzaflix.com',
                phone: phone,
                plan: selectedPlan,
                planName: planData.name,
                planPrice: planData.price,
                planAmount: planData.amount,
                paymentMethod: method,
                idNumber: idNumber || 'N/A',
                subscriptionDate: new Date().toISOString(),
                expiryDate: new Date(Date.now() + (selectedPlan === 'daily' ? 86400000 : 
                                                    selectedPlan === 'weekly' ? 604800000 :
                                                    selectedPlan === 'monthly' ? 2592000000 :
                                                    31536000000)).toISOString(),
                isSubscribed: true,
                paymentStatus: 'confirmed'
            };
            
            // Store subscription data
            localStorage.setItem('tanzaflix_subscription', JSON.stringify(subscriptionData));
            
            // Update user data
            try {
                const existingUser = localStorage.getItem('tanzaflix_user');
                if (existingUser) {
                    const user = JSON.parse(existingUser);
                    user.isSubscribed = true;
                    user.plan = selectedPlan;
                    user.planName = planData.name;
                    user.subscriptionDate = subscriptionData.subscriptionDate;
                    user.expiryDate = subscriptionData.expiryDate;
                    localStorage.setItem('tanzaflix_user', JSON.stringify(user));
                } else {
                    // Create user if doesn't exist
                    const newUser = {
                        name: name,
                        email: subscriptionData.email,
                        phone: phone,
                        isSubscribed: true,
                        plan: selectedPlan,
                        planName: planData.name,
                        subscriptionDate: subscriptionData.subscriptionDate,
                        expiryDate: subscriptionData.expiryDate
                    };
                    localStorage.setItem('tanzaflix_user', JSON.stringify(newUser));
                }
            } catch (err) {
                console.warn('Error saving user data:', err);
            }

            // Update button
            payNowBtn.textContent = '✅ Imefanikiwa!';
            payNowBtn.style.display = 'block';
            payNowBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html?subscription=success';
            }, 2500);

        }, 2500); // Simulate 2.5 second processing time
    });

    // ===== Auto-select plan from URL =====
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam && plans[planParam]) {
        const card = document.querySelector(`.plan-card[data-plan="${planParam}"]`);
        if (card) {
            const btn = card.querySelector('.plan-select-btn');
            if (btn) btn.click();
        }
    }

    console.log('💰 TanzaFlix Subscription page loaded');
    console.log('💳 Real payment flow ready');
});