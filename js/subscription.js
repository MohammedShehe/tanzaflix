document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM Elements =====
    const planCards = document.querySelectorAll('.plan-card');
    const paymentSection = document.getElementById('paymentSection');
    const paymentForm = document.getElementById('paymentForm');
    const cancelBtn = document.getElementById('cancelPlanBtn');
    const selectedPlanName = document.getElementById('selectedPlanName');
    const selectedPlanPrice = document.getElementById('selectedPlanPrice');

    // ===== Plan Data =====
    const plans = {
        daily: { name: 'Kila Siku', price: 'TSh 5,000' },
        weekly: { name: 'Kila Wiki', price: 'TSh 8,000' },
        monthly: { name: 'Kila Mwezi', price: 'TSh 15,000' },
        yearly: { name: 'Kila Mwaka', price: 'TSh 80,000' }
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== Payment Form Submission =====
    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const method = document.getElementById('paymentMethod').value;
        const phone = document.getElementById('phoneNumber').value.trim();
        const name = document.getElementById('fullName').value.trim();
        const idNumber = document.getElementById('idNumber').value.trim();
        const email = document.getElementById('emailAddress').value.trim();

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

        // Simulate payment processing
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Inachakata...';

        setTimeout(() => {
            // Successful subscription
            const userData = {
                name: name,
                email: email || name.toLowerCase().replace(/\s/g, '.') + '@tanzaflix.com',
                phone: phone,
                plan: selectedPlan,
                planName: plans[selectedPlan].name,
                planPrice: plans[selectedPlan].price,
                subscriptionDate: new Date().toISOString(),
                isSubscribed: true
            };
            
            // Store subscription data
            localStorage.setItem('tanzaflix_subscription', JSON.stringify(userData));
            
            // Update user data
            try {
                const existingUser = localStorage.getItem('tanzaflix_user');
                if (existingUser) {
                    const user = JSON.parse(existingUser);
                    user.isSubscribed = true;
                    user.plan = selectedPlan;
                    user.planName = plans[selectedPlan].name;
                    localStorage.setItem('tanzaflix_user', JSON.stringify(user));
                }
            } catch (err) {}

            submitBtn.textContent = '✅ Imefanikiwa!';
            submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

            setTimeout(() => {
                window.location.href = 'dashboard.html?subscription=success';
            }, 1500);

        }, 2500);
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

    console.log('💰 Subscription page loaded');
});