// js/dashboard.js - Dashboard Page

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!auth.checkAuth()) return;

    const user = auth.getUser();
    const profileContainer = document.getElementById('profileContainer');
    const userNameEl = document.getElementById('userName');
    const accountStatusEl = document.getElementById('accountStatusMessage');

    // ===== Logout Button =====
    document.getElementById('logoutBtnHeader').addEventListener('click', function() {
        if (confirm('Je, una uhakika unataka kuondoka?')) {
            auth.logout();
        }
    });

    // ===== Helper: Get user initials =====
    function getUserInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    // ===== Handle Subscribe Button Click =====
    function handleSubscribeClick(e) {
        const btn = e.currentTarget;
        // Show loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:8px;"></span> Inaelekeza...';
        btn.disabled = true;
        btn.style.cursor = 'wait';
        btn.style.opacity = '0.7';
        
        // Navigate to subscription page after short delay
        setTimeout(() => {
            window.location.href = 'subscription.html';
        }, 500);
    }

    // ===== Render Profile =====
    function renderProfile(profileData) {
        const fullName = profileData?.full_name || user?.full_name || user?.name || 'Mgeni wa TanzaFlix';
        const email = profileData?.email || user?.email || 'No email';
        const phone = profileData?.phone || user?.phone || '-';
        const country = profileData?.country || user?.country || '-';
        const region = profileData?.region || user?.region || '';
        const profileImage = profileData?.profile_image || user?.profile_image || null;
        const isSubscribed = profileData?.isSubscribed || user?.isSubscribed || false;
        const planName = profileData?.planName || user?.planName || '';
        const planPrice = profileData?.planPrice || user?.planPrice || '';

        // Set user name for account card
        userNameEl.textContent = fullName;

        // Determine account status message
        let statusMessage = '';
        if (isSubscribed) {
            // Format price display
            const priceDisplay = planPrice ? ` (${planPrice})` : '';
            statusMessage = `
                <p><strong>✅ Mwanachama (Subscriber):</strong> Karibu tena, ${fullName}. 
                Endelea na Sehemu ya 4 pale ulipoishia jana, au gundua tamthilia mpya zilizoongezwa wiki hii.</p>
                <p style="color: #4ade80; font-size: 0.9rem; margin-top: 0.5rem;">
                    <strong>Mpango:</strong> ${planName || 'Active Subscription'} ${priceDisplay}
                </p>
            `;
        } else {
            statusMessage = `
                <p><strong>👤 Mgeni (Guest):</strong> Karibu TanzaFlix! Jiunge leo uanze kufuatilia michezo ya filamu inayovuma zaidi Tanzania. 
                Tazama sehemu ya kwanza (Episode 1) ya tamthilia yoyote bure kabisa!</p>
                <a href="subscription.html" class="subscribe-btn-dashboard" style="display: inline-block; margin-top: 0.5rem; padding: 0.5rem 1.2rem; 
                    background: linear-gradient(135deg, #6c63ff, #ff4eb0); border-radius: 999px; color: #fff; 
                    text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: transform 0.2s ease, opacity 0.2s ease;
                    border: none; cursor: pointer; font-family: inherit;">
                    ⭐ Jisajili Sasa
                </a>
            `;
        }
        accountStatusEl.innerHTML = statusMessage;

        // Add click handler to subscribe button with loading indicator
        const subscribeBtn = document.querySelector('.subscribe-btn-dashboard');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', handleSubscribeClick);
        }

        // Render profile card
        const initial = getUserInitials(fullName);
        const avatarHtml = profileImage 
            ? `<img class="profile-avatar" src="${profileImage}" alt="${fullName}" />`
            : `<div class="profile-avatar-placeholder">${initial}</div>`;

        const regionDisplay = region ? ` • ${region}` : '';

        profileContainer.innerHTML = `
            ${avatarHtml}
            <div class="profile-info">
                <div class="profile-name">${fullName}</div>
                <div class="profile-email">${email}</div>
                <div class="profile-details">
                    <span>📞 ${phone}</span>
                    <span>🌍 ${country}${regionDisplay}</span>
                    ${isSubscribed 
                        ? `<span class="badge-subscriber">✅ Mwanachama</span>` 
                        : `<span class="badge-guest">👤 Mgeni</span>`
                    }
                </div>
            </div>
        `;
    }

    // ===== Load User Profile =====
    try {
        const profileData = await api.getProfile();
        if (profileData.success && profileData.user) {
            renderProfile(profileData.user);
        } else {
            renderProfile(null);
        }
    } catch (error) {
        console.warn('Could not load profile:', error);
        renderProfile(null);
    }

    // ===== Load Subscription Status =====
    try {
        const subData = localStorage.getItem('tanzaflix_subscription');
        if (subData) {
            const subscription = JSON.parse(subData);
            if (subscription.isSubscribed && new Date(subscription.expiryDate) > new Date()) {
                // Update user data with subscription info including price
                try {
                    const currentUser = auth.getUser() || {};
                    currentUser.isSubscribed = true;
                    currentUser.planName = subscription.planName || subscription.plan || '';
                    currentUser.planPrice = subscription.planPrice || '';
                    localStorage.setItem('tanzaflix_user', JSON.stringify(currentUser));
                    
                    // Re-render profile with updated data
                    const profileData = await api.getProfile();
                    if (profileData.success && profileData.user) {
                        renderProfile(profileData.user);
                    } else {
                        renderProfile(currentUser);
                    }
                } catch (e) {
                    console.warn('Error updating user data:', e);
                }
            }
        }
    } catch (error) {
        console.warn('Could not load subscription:', error);
    }

    // ===== Choice Card Click =====
    function setupCard(el) {
        if (!el) return;
        el.addEventListener('click', function(e) {
            const isTranslated = this.id === 'translatedOption';
            localStorage.setItem('tanzaflix_translated_preference', isTranslated ? '1' : '0');
            window.location.href = `movies.html?translated=${isTranslated ? '1' : '0'}`;
        });
    }

    setupCard(document.getElementById('translatedOption'));
    setupCard(document.getElementById('originalOption'));
});

// ===== About Modal Functions =====
function openAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) modal.style.display = 'block';
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => {
        m.style.display = 'none';
    });
}

// Navigation click handlers
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && !href.startsWith('#')) {
            return;
        }
        e.preventDefault();
        const id = this.id;
        if (id === 'navAbout') {
            openAboutModal();
        } else if (id === 'navPayment') {
            window.location.href = 'subscription.html';
        }
    });
});

// Modal close handlers
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModals();
    });
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModals();
    }
});

console.log('✅ TanzaFlix dashboard initialized');