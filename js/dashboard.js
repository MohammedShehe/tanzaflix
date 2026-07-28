// js/dashboard.js - Dashboard Page with Continue Watching

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
    const continueWatchingContainer = document.getElementById('continueWatchingContainer');

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
        btn.innerHTML = '<span class="spinner"></span> Inaelekeza...';
        btn.disabled = true;
        btn.style.cursor = 'wait';
        btn.style.opacity = '0.7';
        
        setTimeout(() => {
            window.location.href = 'subscription.html';
        }, 500);
    }

    // ===== Render Continue Watching =====
    function renderContinueWatching(items) {
        if (!continueWatchingContainer) return;
        
        if (!items || items.length === 0) {
            continueWatchingContainer.innerHTML = `
                <div class="dash-continue-empty">
                    🎬 Hakuna movie unayoendelea. <a href="movies.html">Anza kutazama</a>
                </div>
            `;
            return;
        }

        // Show only first 4 items
        const recent = items.slice(0, 4);

        continueWatchingContainer.innerHTML = `
            <div class="dash-continue-grid">
                ${recent.map(item => {
                    const progress = Math.round(item.percentage || 0);
                    const title = item.display_title || item.movie_title;
                    const timeAgo = formatTimeAgo(item.last_updated);
                    const isClickable = item.canWatch;

                    // Get badge
                    let badgeLabel = '📺 Akaunti';
                    if (item.accessType === 'paid_single') {
                        badgeLabel = '💳 Imenunuliwa';
                    } else if (item.accessType === 'free_trial_possible') {
                        badgeLabel = '🎁 Majaribio';
                    } else if (!isClickable) {
                        badgeLabel = '🔒 Imefungwa';
                    }

                    const thumbnailHtml = item.poster
                        ? `<img src="${item.poster}" alt="${title}" loading="lazy" />`
                        : `<div class="thumb-placeholder">🎬</div>`;

                    const onClickAttr = isClickable
                        ? `onclick="window.location.href='player.html?movie=${item.movie_id}${item.episode_id ? '&episode=' + item.episode_id : ''}&resume=${item.resume_at || 0}'"`
                        : '';

                    return `
                        <div class="dash-continue-item ${isClickable ? 'is-clickable' : 'is-locked'}" ${onClickAttr}>
                            <div class="dash-continue-thumb">
                                ${thumbnailHtml}
                                <div class="dash-continue-progress">
                                    <div class="dash-continue-progress-fill" style="width: ${Math.min(100, progress)}%;"></div>
                                </div>
                                ${isClickable ? `
                                    <div class="dash-continue-overlay">
                                        <div class="play-icon">▶</div>
                                    </div>
                                ` : `
                                    <div class="dash-continue-lock">
                                        <span>🔒</span>
                                    </div>
                                `}
                            </div>
                            <div class="dash-continue-body">
                                <div class="dash-continue-title">${title}</div>
                                <div class="dash-continue-meta">
                                    <span class="percentage">${progress}%</span>
                                    <span>${timeAgo}</span>
                                    <span class="dash-continue-badge">${badgeLabel}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ===== Render Watch History =====
    function renderWatchHistory(history) {
        if (!history || history.length === 0) {
            watchHistoryContainer.innerHTML = `
                <div class="watch-history-empty">
                    <p>📭 Bado haujatazama movie yoyote.</p>
                    <p style="font-size:0.85rem;color:#818cf8;">
                        Nenda kwenye <a href="movies.html" style="color:#818cf8;text-decoration:underline;">Filamu</a> uanze kutazama!
                    </p>
                </div>
            `;
            return;
        }

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
                                    <span>${formatTimeAgo(item.created_at)}${durationHtml}</span>
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

        userNameEl.textContent = fullName;

        let statusMessage = '';
        if (isSubscribed) {
            const priceDisplay = planPrice ? ` (${planPrice})` : '';
            statusMessage = `
                <p><strong>✅ Mwanachama (Subscriber):</strong> Karibu tena, ${fullName}!</p>
                <p style="color: #4ade80; font-size: 0.9rem;">
                    <strong>Mpango:</strong> ${planName || 'Active Subscription'} ${priceDisplay}
                </p>
                <p style="color: #9aa2d7; font-size: 0.9rem;">
                    Endelea na Sehemu ulipoishia jana, au gundua tamthilia mpya zilizoongezwa wiki hii.
                </p>
            `;
        } else {
            statusMessage = `
                <p><strong>👤 Mgeni (Guest):</strong> Karibu TanzaFlix! Jiunge leo uanze kufuatilia michezo ya filamu inayovuma zaidi Tanzania.</p>
                <p style="color: #fbbf24; font-size: 0.9rem;">
                    ⭐ <strong>Tazama sehemu ya kwanza (Episode 1) ya tamthilia yoyote bure kabisa!</strong>
                </p>
                <a href="subscription.html" class="subscribe-btn-dashboard" style="display: inline-block; margin-top: 0.3rem; padding: 0.5rem 1.2rem; 
                    background: linear-gradient(135deg, #6c63ff, #ff4eb0); border-radius: 999px; color: #fff; 
                    text-decoration: none; font-weight: 600; font-size: 0.85rem;
                    border: none; cursor: pointer; font-family: inherit;">
                    ⭐ Jisajili Sasa
                </a>
            `;
        }
        accountStatusEl.innerHTML = statusMessage;

        const subscribeBtn = document.querySelector('.subscribe-btn-dashboard');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', handleSubscribeClick);
        }

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

    // ===== Load Continue Watching =====
    async function loadContinueWatching() {
        try {
            const response = await api.getContinueWatching(10);
            if (response.success && response.data && response.data.items) {
                renderContinueWatching(response.data.items);
                return response.data.items;
            } else {
                renderContinueWatching([]);
                return [];
            }
        } catch (error) {
            console.warn('Could not load continue watching:', error);
            renderContinueWatching([]);
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

    // ===== Load Active Ads for Slider =====
    async function loadActiveAds() {
        try {
            const response = await api.getActiveAds();
            if (response.success && response.ads && response.ads.length > 0) {
                renderAdsInSlider(response.ads);
                return response.ads;
            }
            // If no ads, hide the ad slides or show placeholder
            const sliderTrack = document.getElementById('sliderTrack');
            if (sliderTrack) {
                const adSlides = sliderTrack.querySelectorAll('.slider-slide[data-type="ad"]');
                adSlides.forEach(slide => slide.style.display = 'none');
            }
            return [];
        } catch (error) {
            console.warn('Could not load active ads:', error);
            return [];
        }
    }

    // ===== Render Ads in Slider =====
    function renderAdsInSlider(ads) {
        const sliderTrack = document.getElementById('sliderTrack');
        if (!sliderTrack) return;

        // Remove existing ad slides (keep developer slide at index 0)
        const existingAdSlides = sliderTrack.querySelectorAll('.slider-slide[data-type="ad"]');
        existingAdSlides.forEach(slide => slide.remove());

        // Group ads in pairs (2 per slide)
        const adPairs = [];
        for (let i = 0; i < ads.length; i += 2) {
            adPairs.push(ads.slice(i, i + 2));
        }

        if (adPairs.length === 0) {
            // Show a placeholder if no ads
            const placeholderSlide = document.createElement('div');
            placeholderSlide.className = 'slider-slide';
            placeholderSlide.dataset.type = 'ad';
            placeholderSlide.dataset.index = 1;
            placeholderSlide.innerHTML = `
                <div style="display:grid;place-items:center;min-height:200px;color:#9aa2d7;text-align:center;padding:2rem;">
                    <p style="font-size:1.2rem;">📢 Hakuna matangazo kwa sasa</p>
                    <p style="font-size:0.85rem;">Check back later for updates!</p>
                </div>
            `;
            sliderTrack.appendChild(placeholderSlide);
            updateSliderDots();
            return;
        }

        // Create slides for each pair of ads
        adPairs.forEach((pair, index) => {
            const slide = document.createElement('div');
            slide.className = 'slider-slide';
            slide.dataset.type = 'ad';
            slide.dataset.index = index + 1; // +1 because index 0 is developer slide

            const adGrid = document.createElement('div');
            adGrid.className = 'ad-grid';

            pair.forEach(ad => {
                const adCard = document.createElement('div');
                adCard.className = 'ad-card';

                const imageHtml = ad.image_url
                    ? `<img src="${ad.image_url}" alt="${ad.title}" class="ad-image" loading="lazy" />`
                    : `<div class="ad-placeholder">📢</div>`;

                adCard.innerHTML = `
                    <a href="#" class="ad-image-link" data-ad-id="${ad.id}" data-url="${ad.url}" title="${ad.title}">
                        ${imageHtml}
                    </a>
                    <div class="ad-body">
                        <p class="ad-title"><a href="#" class="ad-link" data-ad-id="${ad.id}" data-url="${ad.url}">${ad.title}</a></p>
                        <p class="ad-subtitle">Sponsored</p>
                        <a href="#" class="ad-cta ad-link" data-ad-id="${ad.id}" data-url="${ad.url}">Tembelea →</a>
                    </div>
                `;

                adGrid.appendChild(adCard);
            });

            slide.appendChild(adGrid);
            sliderTrack.appendChild(slide);
        });

        // Add click tracking to all ad links
        document.querySelectorAll('.ad-link, .ad-image-link').forEach(el => {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                const adId = this.dataset.adId;
                const url = this.dataset.url;
                if (adId && url) {
                    trackAdClick(adId, url);
                }
            });
        });

        // Update dots
        updateSliderDots();
    }

    // ===== Track Ad Click =====
    async function trackAdClick(adId, url) {
        try {
            // Track the click via API
            await api.trackAdClick(adId);
            // Redirect to the ad URL
            window.open(url, '_blank');
        } catch (error) {
            console.warn('Error tracking ad click:', error);
            // Still redirect even if tracking fails
            window.open(url, '_blank');
        }
    }

    // ===== Update Slider Dots =====
    function updateSliderDots() {
        const sliderTrack = document.getElementById('sliderTrack');
        const dotsContainer = document.getElementById('sliderDots');
        if (!sliderTrack || !dotsContainer) return;

        const slides = sliderTrack.querySelectorAll('.slider-slide');
        const totalSlides = slides.length;

        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('data-index', i);
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', function() {
                goToSlide(parseInt(this.getAttribute('data-index')));
            });
            dotsContainer.appendChild(dot);
        }

        // Update slide label
        const slideLabel = document.getElementById('slideLabel');
        if (slideLabel) {
            slideLabel.textContent = `Slide 1 / ${totalSlides}`;
        }
    }

    // ===== Slider/Carousel Functions =====
    let currentSlideIndex = 0;
    let autoPlayInterval = null;
    const AUTO_PLAY_DELAY = 5000;

    function goToSlide(index) {
        const track = document.getElementById('sliderTrack');
        const slides = track ? track.querySelectorAll('.slider-slide') : [];
        const totalSlides = slides.length;
        
        if (totalSlides === 0) return;
        
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        
        currentSlideIndex = index;
        track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
        
        // Update dots
        document.querySelectorAll('.slider-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlideIndex);
        });
        
        // Update label
        const slideLabel = document.getElementById('slideLabel');
        if (slideLabel) {
            slideLabel.textContent = `Slide ${currentSlideIndex + 1} / ${totalSlides}`;
        }
        
        resetAutoPlay();
    }

    function nextSlide() {
        goToSlide(currentSlideIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentSlideIndex - 1);
    }

    function resetAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
        startAutoPlay();
    }

    function startAutoPlay() {
        if (autoPlayInterval) return;
        const slides = document.querySelectorAll('.slider-slide');
        if (slides.length <= 1) return;
        autoPlayInterval = setInterval(nextSlide, AUTO_PLAY_DELAY);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    // ===== Load Everything =====
    await loadProfile();
    await loadContinueWatching();
    await loadWatchHistory();
    await loadSubscriptionStatus();
    await loadActiveAds();

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

    // ===== Initialize Slider Controls =====
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const sliderContainer = document.getElementById('developerSlider');

    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            prevSlide();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            nextSlide();
        });
    }

    // Pause auto-play on hover
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoPlay);
        sliderContainer.addEventListener('mouseleave', startAutoPlay);
        
        // Touch support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        sliderContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        sliderContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }, { passive: true });
    }

    // Keyboard support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
        }
    });

    startAutoPlay();
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