// js/dashboard.js - Dashboard Page with Professional Watch History

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!auth.checkAuth()) return;

    const user = auth.getUser();
    const profileContainer = document.getElementById('profileContainer');
    const userNameEl = document.getElementById('userName');
    const accountStatusEl = document.getElementById('accountStatusMessage');
    const watchHistoryContainer = document.getElementById('watchHistoryContainer');

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

    // ===== Format time =====
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Sasa hivi';
        if (diffMins < 60) return `${diffMins} dk iliyopita`;
        if (diffHours < 24) return `${diffHours} sa iliyopita`;
        if (diffDays < 7) return `${diffDays} siku iliyopita`;
        return date.toLocaleDateString('sw');
    }

    // ===== Format duration =====
    function formatDuration(seconds) {
        if (!seconds || seconds === 0) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        if (mins === 0) return `${secs}s`;
        if (secs === 0) return `${mins}m`;
        return `${mins}m ${secs}s`;
    }

    // ===== Get access type label =====
    function getAccessTypeLabel(type) {
        const labels = {
            'subscription': '📺 Akaunti',
            'free_trial': '🎁 Majaribio',
            'paid_single': '💳 Imenunuliwa',
            'denied': '🚫 Imekataliwa',
            'watched': '▶️ Imetazamwa'
        };
        return labels[type] || type || '📺 Imetazamwa';
    }

    // ===== Get access badge class =====
    function getAccessBadgeClass(type) {
        const classes = {
            'subscription': 'subscription',
            'free_trial': 'free_trial',
            'paid_single': 'paid_single',
            'denied': 'incomplete',
            'watched': 'completed'
        };
        return classes[type] || 'completed';
    }

    // ===== Handle Subscribe Button Click =====
    function handleSubscribeClick(e) {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:8px;"></span> Inaelekeza...';
        btn.disabled = true;
        btn.style.cursor = 'wait';
        btn.style.opacity = '0.7';
        
        setTimeout(() => {
            window.location.href = 'subscription.html';
        }, 500);
    }

    // ===== Render Watch History =====
    function renderWatchHistory(history) {
        if (!history || history.length === 0) {
            watchHistoryContainer.innerHTML = `
                <div class="watch-history-empty">
                    <p>📭 Bado haujatazama movie yoyote.</p>
                    <p style="font-size:0.85rem;color:#818cf8;margin-top:0.3rem;">
                        Nenda kwenye <a href="movies.html" style="color:#818cf8;text-decoration:underline;">Filamu</a> uanze kutazama!
                    </p>
                </div>
            `;
            return;
        }

        // Get last 5 entries
        const recent = history.slice(0, 5);

        watchHistoryContainer.innerHTML = `
            <ul class="watch-history-list">
                ${recent.map(item => {
                    const typeLabel = getAccessTypeLabel(item.access_type);
                    const badgeClass = getAccessBadgeClass(item.access_type);
                    const statusLabel = item.completed ? '✅ Imekamilika' : '⏳ Haijakamilika';
                    const statusClass = item.completed ? 'completed' : 'incomplete';
                    
                    const title = item.movie_title || 'Movie';
                    const episodeInfo = item.episode_title 
                        ? ` - S${item.episode_number || ''}: ${item.episode_title}` 
                        : '';
                    
                    const durationDisplay = item.watched_duration ? formatDuration(item.watched_duration) : '';
                    const durationHtml = durationDisplay ? ` • ⏱️ ${durationDisplay}` : '';
                    
                    return `
                        <li>
                            <span class="history-icon">${item.completed ? '✅' : '▶️'}</span>
                            <div class="history-info">
                                <div class="history-title">${title}${episodeInfo}</div>
                                <div class="history-meta">
                                    ${formatTimeAgo(item.created_at)}${durationHtml}
                                    <span class="history-badge ${statusClass}">${statusLabel}</span>
                                    <span class="history-badge ${badgeClass}">${typeLabel}</span>
                                </div>
                            </div>
                        </li>
                    `;
                }).join('')}
            </ul>
            ${history.length > 5 ? `<p style="color:#9aa2d7;font-size:0.8rem;margin-top:0.5rem;text-align:center;">+ ${history.length - 5} zaidi</p>` : ''}
        `;
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
            const priceDisplay = planPrice ? ` (${planPrice})` : '';
            statusMessage = `
                <p><strong>✅ Mwanachama (Subscriber):</strong> Karibu tena, ${fullName}!</p>
                <p style="color: #4ade80; font-size: 0.9rem; margin-top: 0.3rem;">
                    <strong>Mpango:</strong> ${planName || 'Active Subscription'} ${priceDisplay}
                </p>
                <p style="color: #9aa2d7; font-size: 0.9rem; margin-top: 0.5rem;">
                    Endelea na Sehemu ulipoishia jana, au gundua tamthilia mpya zilizoongezwa wiki hii.
                </p>
            `;
        } else {
            statusMessage = `
                <p><strong>👤 Mgeni (Guest):</strong> Karibu TanzaFlix! Jiunge leo uanze kufuatilia michezo ya filamu inayovuma zaidi Tanzania.</p>
                <p style="color: #fbbf24; font-size: 0.9rem; margin: 0.3rem 0 0.5rem;">
                    ⭐ <strong>Tazama sehemu ya kwanza (Episode 1) ya tamthilia yoyote bure kabisa!</strong>
                </p>
                <a href="subscription.html" class="subscribe-btn-dashboard" style="display: inline-block; margin-top: 0.3rem; padding: 0.5rem 1.2rem; 
                    background: linear-gradient(135deg, #6c63ff, #ff4eb0); border-radius: 999px; color: #fff; 
                    text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: transform 0.2s ease, opacity 0.2s ease;
                    border: none; cursor: pointer; font-family: inherit;">
                    ⭐ Jisajili Sasa
                </a>
            `;
        }
        accountStatusEl.innerHTML = statusMessage;

        // Add click handler to subscribe button
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
    async function loadProfile() {
        try {
            const profileData = await api.getProfile();
            if (profileData.success && profileData.user) {
                renderProfile(profileData.user);
                return profileData.user;
            }
            renderProfile(null);
            return null;
        } catch (error) {
            console.warn('Could not load profile:', error);
            renderProfile(null);
            return null;
        }
    }

    // ===== Load Watch History =====
    async function loadWatchHistory() {
        try {
            const response = await api.getWatchHistory();
            if (response.success && response.history) {
                renderWatchHistory(response.history);
                return response.history;
            } else {
                renderWatchHistory([]);
                return [];
            }
        } catch (error) {
            console.warn('Could not load watch history:', error);
            renderWatchHistory([]);
            return [];
        }
    }

    // ===== Load Subscription Status =====
    async function loadSubscriptionStatus() {
        try {
            const response = await api.getSubscriptionStatus();
            if (response.success && response.subscription && response.subscription.is_active) {
                const sub = response.subscription;
                const currentUser = auth.getUser() || {};
                currentUser.isSubscribed = true;
                currentUser.planName = sub.plan_name || sub.planName || '';
                currentUser.planPrice = sub.price || sub.planPrice || '';
                localStorage.setItem('tanzaflix_user', JSON.stringify(currentUser));
                
                // Re-render profile with updated data
                const profileData = await api.getProfile();
                if (profileData.success && profileData.user) {
                    renderProfile(profileData.user);
                } else {
                    renderProfile(currentUser);
                }
                return sub;
            }
            return null;
        } catch (error) {
            console.warn('Could not load subscription:', error);
            return null;
        }
    }

    // ===== Load Everything =====
    await loadProfile();
    await loadWatchHistory();
    await loadSubscriptionStatus();

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