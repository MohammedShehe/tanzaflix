// js/admin.js - Admin Panel

import api from './api.js';
import auth from './auth.js';

// ===== Global Modal Functions =====
window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
};

// ===== Season/Episode Functions =====
let seasonCounter = 0;
let episodeCounter = 0;

window.addSeason = function(seasonData = null) {
    const container = document.getElementById('seasonsContainer');
    if (!container) return;
    
    const seasonId = seasonCounter++;
    const seasonNumber = seasonData?.season_number || container.children.length + 1;
    
    const group = document.createElement('div');
    group.className = 'season-group';
    group.dataset.seasonId = seasonId;
    group.dataset.seasonNumber = seasonNumber;
    group.innerHTML = `
        <div class="season-header">
            <h4>Season ${seasonNumber}</h4>
            <button type="button" class="remove-season" onclick="this.closest('.season-group').remove()">
                <i class="fas fa-trash"></i> Futa Season
            </button>
        </div>
        <input type="hidden" class="season-number-input" value="${seasonNumber}" />
        <div class="form-row">
            <div class="form-group">
                <label>Namba ya Season</label>
                <input type="number" class="season-number-field" value="${seasonNumber}" min="1" required />
            </div>
            <div class="form-group">
                <label>Jina la Season</label>
                <input type="text" class="season-name-field" placeholder="Season ${seasonNumber} - Jina" value="${seasonData?.season_name || ''}" />
            </div>
        </div>
        <div class="episodes-container" id="episodes-${seasonId}">
            <label style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:0.3rem;">Episodes</label>
        </div>
        <button type="button" class="add-episode-btn" onclick="window.addEpisode(${seasonId})">
            <i class="fas fa-plus"></i> Ongeza Episode
        </button>
    `;
    container.appendChild(group);
    
    if (seasonData?.episodes) {
        seasonData.episodes.forEach(ep => {
            window.addEpisode(seasonId, ep);
        });
    }
};

window.addEpisode = function(seasonId, episodeData = null) {
    const container = document.getElementById(`episodes-${seasonId}`);
    if (!container) return;
    
    const episodeIndex = container.children.length;
    const episodeNumber = episodeData?.episode_number || episodeIndex + 1;
    const episodeId = episodeCounter++;
    
    const fieldName = `episodes_${episodeId}`;
    
    const item = document.createElement('div');
    item.className = 'episode-item';
    item.dataset.episodeId = episodeId;
    item.innerHTML = `
        <div class="form-group">
            <label>Namba ya Episode</label>
            <input type="number" class="episode-number" value="${episodeNumber}" min="1" required />
        </div>
        <div class="form-group">
            <label>Jina la Episode</label>
            <input type="text" class="episode-title" placeholder="Episode ${episodeNumber}" value="${episodeData?.episode_title || ''}" />
        </div>
        <div class="form-group">
            <label>Muda</label>
            <input type="text" class="episode-duration" placeholder="45m" value="${episodeData?.duration || ''}" />
        </div>
        <div class="form-group file-input-wrapper">
            <label>Video</label>
            <input type="file" class="episode-video" name="${fieldName}" accept="video/*,.mp4,.mkv,.avi" required />
            <span class="file-status" id="file-status-${episodeId}">Hakuna video</span>
        </div>
        <button type="button" class="remove-episode" onclick="this.closest('.episode-item').remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(item);
    
    const fileInput = item.querySelector('.episode-video');
    const statusSpan = item.querySelector('.file-status');
    if (fileInput && statusSpan) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                statusSpan.textContent = `✅ ${this.files[0].name}`;
                statusSpan.className = 'file-status uploaded';
            } else {
                statusSpan.textContent = 'Hakuna video';
                statusSpan.className = 'file-status';
            }
        });
    }
};

function setButtonLoading(button, isLoading, loadingText = 'Inapakia...') {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        if (!button.dataset.originalHtml) {
            button.dataset.originalHtml = button.innerHTML;
        }
        button.innerHTML = `
            <span class="spinner"></span>
            ${loadingText}
        `;
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

document.addEventListener('DOMContentLoaded', function() {
    if (!auth.checkAuth() || !auth.checkAdmin()) return;

    // ===== State =====
    let currentTab = 'movies';
    let deleteTarget = null;
    let deleteType = null;
    let statsVisible = true;
    let usersStatsVisible = true;
    let moviesData = [];
    let usersData = [];
    let subscriptionsData = [];

    // ===== DOM Elements =====
    const tabs = document.querySelectorAll('.nav-item');
    const tabContents = {
        movies: document.getElementById('moviesTab'),
        users: document.getElementById('usersTab'),
        transactions: document.getElementById('transactionsTab'),
        subscriptions: document.getElementById('subscriptionsTab'),
        ratings: document.getElementById('ratingsTab'),
    };

    // ===== Function to switch tabs =====
    function switchTab(tabName) {
        // Update nav items
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        // Update tab contents
        Object.keys(tabContents).forEach(key => {
            if (tabContents[key]) {
                tabContents[key].classList.remove('active');
            }
        });
        if (tabContents[tabName]) {
            tabContents[tabName].classList.add('active');
        }
        currentTab = tabName;
        
        // Load data for the tab
        if (tabName === 'movies') loadMovies();
        else if (tabName === 'users') loadUsers();
        else if (tabName === 'transactions') loadTransactions();
        else if (tabName === 'ratings') loadRatings();
        else if (tabName === 'subscriptions') loadSubscriptions();
    }

    // ===== Check URL hash for initial tab =====
    function getTabFromHash() {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['movies', 'users', 'subscriptions', 'transactions', 'ratings'];
        if (hash && validTabs.includes(hash)) {
            return hash;
        }
        return 'movies';
    }

    // ===== Activities Navigation =====
    const navActivities = document.getElementById('navActivities');
    const openActivitiesBtn1 = document.getElementById('openActivitiesDashboardBtn');
    const openActivitiesBtn2 = document.getElementById('openActivitiesDashboardBtn2');

    function navigateToActivities(e) {
        if (e) e.preventDefault();
        window.location.href = 'admin-activities.html';
    }

    if (navActivities) {
        navActivities.addEventListener('click', navigateToActivities);
    }
    if (openActivitiesBtn1) {
        openActivitiesBtn1.addEventListener('click', navigateToActivities);
    }
    if (openActivitiesBtn2) {
        openActivitiesBtn2.addEventListener('click', navigateToActivities);
    }

    // ===== Real-time Clock =====
    function updateClock() {
        const now = new Date();
        const time = now.toTimeString().slice(0, 8);
        const days = ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi'];
        const day = days[now.getDay()];
        const date = `${day}, ${now.getDate()} ${now.toLocaleString('sw', { month: 'long' })} ${now.getFullYear()}`;
        document.getElementById('clockTime').textContent = time;
        document.getElementById('clockDate').textContent = date;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ===== Admin Profile Dropdown =====
    const adminProfile = document.getElementById('adminProfile');
    const profileDropdown = document.getElementById('profileDropdown');

    if (adminProfile) {
        adminProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            if (profileDropdown) {
                profileDropdown.classList.toggle('active');
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (adminProfile && !adminProfile.contains(e.target)) {
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }
        }
    });

    // ===== Logout =====
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Je, una uhakika unataka kuondoka?')) {
                auth.logout();
            }
        });
    }

    // ===== Tab Navigation =====
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Skip activities tab - handled by navigateToActivities
            if (tabName === 'activities') {
                navigateToActivities();
                return;
            }
            
            // Update URL hash without page reload
            window.location.hash = tabName;
            switchTab(tabName);
        });
    });

    // ===== Handle hash change (for back/forward buttons) =====
    window.addEventListener('hashchange', function() {
        const tab = getTabFromHash();
        switchTab(tab);
    });

    // ===== Load Movies =====
    async function loadMovies() {
        try {
            const response = await api.adminGetMovies();
            if (response.success && response.movies) {
                moviesData = response.movies;
                renderMovies();
                renderMoviesStats();
                populateMoreLikeSelect();
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            const tbody = document.getElementById('moviesTableBody');
            if (tbody) {
                tbody.innerHTML = 
                    `<tr><td colspan="9" class="empty-state">Error loading movies: ${error.message}</td></tr>`;
            }
        }
    }

    function renderMovies() {
        const tbody = document.getElementById('moviesTableBody');
        if (!tbody) return;
        
        if (!moviesData.length) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Hakuna movies zilizosajiliwa</td></tr>`;
            return;
        }
        tbody.innerHTML = moviesData.map(m => {
            const contentTypeBadge = m.movie_type === 'series' 
                ? '<span class="badge-series">📺 Series</span>' 
                : '<span class="badge-single">🎬 Single</span>';
            
            const translatedBadge = m.is_translated 
                ? '<span class="badge-translated">✅ Imetafsiriwa</span>' 
                : '<span class="badge-not-translated">❌ Haijatafsiriwa</span>';
            
            const ratingDisplay = m.total_ratings > 0 
                ? `${m.avg_rating?.toFixed(1) || 0}/10 (${m.total_ratings})`
                : 'Hakuna rating';
            
            return `
            <tr>
                <td><strong>${m.title}</strong> ${contentTypeBadge}</td>
                <td>${m.language || 'Unknown'}</td>
                <td>${m.country || '-'}</td>
                <td>${m.category || '-'}</td>
                <td>${translatedBadge}</td>
                <td>${m.year || '-'}</td>
                <td>TSh ${m.price ? m.price.toLocaleString() : '0'}</td>
                <td>${ratingDisplay}</td>
                <td>
                    <button class="action-btn action-btn-view" onclick="window.viewMovie(${m.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn action-btn-edit" onclick="window.editMovie(${m.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn action-btn-delete" onclick="window.deleteMovie(${m.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
    }

    function populateMoreLikeSelect() {
        const select = document.getElementById('movieMoreLike');
        if (!select) return;
        
        const currentValues = Array.from(select.selectedOptions).map(o => o.value);
        select.innerHTML = '<option value="">Chagua movies zinazofanana</option>';
        moviesData.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.title;
            if (currentValues.includes(String(m.id))) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }

    // ===== Load Users =====
    async function loadUsers() {
        try {
            const response = await api.adminGetUsers();
            if (response.success && response.users) {
                usersData = response.users;
                renderUsers();
                renderUsersStats();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            const tbody = document.getElementById('usersTableBody');
            if (tbody) {
                tbody.innerHTML = 
                    `<tr><td colspan="7" class="empty-state">Error loading users: ${error.message}</td></tr>`;
            }
        }
    }

    function renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (!usersData.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hakuna watumizi waliosajiliwa</td></tr>`;
            return;
        }
        tbody.innerHTML = usersData.map(u => `
            <tr>
                <td>${u.full_name}</td>
                <td>${u.email}</td>
                <td>${u.phone || '-'}</td>
                <td>${u.country || '-'}</td>
                <td>${u.region || '-'}</td>
                <td>
                    ${u.profile_image ? 
                        `<img src="${u.profile_image}" alt="${u.full_name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.1);" />` : 
                        `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6c63ff,#ff4eb0);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:16px;">${u.full_name?.charAt(0) || '?'}</div>`
                    }
                </td>
                <td>
                    <button class="action-btn action-btn-view" onclick="window.viewUser(${u.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn action-btn-edit" onclick="window.editUser(${u.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn action-btn-delete" onclick="window.deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    // ===== Load Transactions =====
    async function loadTransactions() {
        try {
            const response = await api.adminGetAllPayments();
            if (response.success && response.payments) {
                renderTransactions(response.payments);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            const tbody = document.getElementById('transactionsTableBody');
            if (tbody) {
                tbody.innerHTML = 
                    `<tr><td colspan="7" class="empty-state">Error loading transactions: ${error.message}</td></tr>`;
            }
        }
    }

    function renderTransactions(payments) {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;
        
        const totalIncome = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const completed = payments.filter(p => p.status === 'paid').length;
        const pending = payments.filter(p => p.status === 'pending' || p.status === 'processing').length;
        const customers = new Set(payments.filter(p => p.status === 'paid').map(p => p.user_id)).size;

        document.getElementById('totalIncome').textContent = `TSh ${totalIncome.toLocaleString()}`;
        document.getElementById('completedTransactions').textContent = completed;
        document.getElementById('pendingTransactions').textContent = pending;
        document.getElementById('totalCustomers').textContent = customers;

        if (!payments.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hakuna manunuzi yaliyofanywa</td></tr>`;
            return;
        }
        tbody.innerHTML = payments.slice(0, 50).map((p, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${p.user_name || 'Unknown'}</td>
                <td>${p.plan_name || 'Movie Purchase'}</td>
                <td>TSh ${parseFloat(p.amount || 0).toLocaleString()}</td>
                <td><span class="status-badge ${p.status === 'paid' ? 'status-confirmed' : 'status-processing'}">${p.status === 'paid' ? 'Imekamilika' : 'Inasubiri'}</span></td>
                <td>${p.paid_at ? new Date(p.paid_at).toLocaleString('sw') : new Date(p.created_at).toLocaleString('sw')}</td>
            </tr>
        `).join('');
    }

    // ===== Load Subscriptions =====
    async function loadSubscriptions() {
        try {
            const response = await api.adminGetAllSubscriptions();
            if (response.success && response.subscriptions) {
                subscriptionsData = response.subscriptions;
                renderSubscriptions();
            }
        } catch (error) {
            console.error('Error loading subscriptions:', error);
            const tbody = document.getElementById('subscriptionsTableBody');
            if (tbody) {
                tbody.innerHTML = 
                    `<tr><td colspan="8" class="empty-state">Error loading subscriptions: ${error.message}</td></tr>`;
            }
        }
    }

    function renderSubscriptions() {
        const tbody = document.getElementById('subscriptionsTableBody');
        if (!tbody) return;
        
        if (!subscriptionsData.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hakuna usajili uliosajiliwa</td></tr>`;
            return;
        }

        const activeCount = subscriptionsData.filter(s => s.status === 'active' && new Date(s.expires_at) > new Date()).length;
        const cancellingCount = subscriptionsData.filter(s => s.status === 'cancelling').length;
        const expiredCount = subscriptionsData.filter(s => s.status === 'expired').length;
        
        document.getElementById('subActiveCount').textContent = activeCount;
        document.getElementById('subCancellingCount').textContent = cancellingCount;
        document.getElementById('subExpiredCount').textContent = expiredCount;
        document.getElementById('subTotalCount').textContent = subscriptionsData.length;

        tbody.innerHTML = subscriptionsData.map(s => {
            const isActive = s.status === 'active' && new Date(s.expires_at) > new Date();
            const isCancelling = s.status === 'cancelling';
            const isExpired = s.status === 'expired';
            
            let statusBadge = '';
            let statusLabel = '';
            
            if (isActive) {
                statusBadge = 'status-active';
                statusLabel = '✅ Inatumika';
            } else if (isCancelling) {
                statusBadge = 'status-cancelling';
                statusLabel = '⏳ Inaghairiwa';
            } else if (isExpired) {
                statusBadge = 'status-expired';
                statusLabel = '❌ Imeisha';
            } else {
                statusBadge = 'status-unknown';
                statusLabel = s.status_label || s.status || 'Unknown';
            }
            
            const expiryDate = new Date(s.expires_at);
            const daysLeft = Math.max(0, Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)));
            
            return `
            <tr>
                <td><strong>${s.user_name || 'Unknown'}</strong></td>
                <td>${s.user_email || '-'}</td>
                <td>${s.plan_name || '-'}</td>
                <td>TSh ${parseFloat(s.price || 0).toLocaleString()}</td>
                <td><span class="subscription-status ${statusBadge}">${statusLabel}</span></td>
                <td>${expiryDate.toLocaleDateString('sw')}</td>
                <td>${daysLeft > 0 ? `${daysLeft} siku` : 'Imeisha'}</td>
                <td>
                    ${isActive ? 
                        `<button class="action-btn action-btn-delete" onclick="window.cancelSubscriptionAdmin(${s.user_id}, '${s.user_name}')" title="Ghairi Usajili"><i class="fas fa-ban"></i></button>` : 
                        '<span style="color:var(--text-muted);font-size:0.7rem;">-</span>'
                    }
                </td>
            </tr>
        `}).join('');
    }

    // ===== Admin Cancel Subscription =====
    window.cancelSubscriptionAdmin = function(userId, userName) {
        if (confirm(`Je, una uhakika unataka kughairi usajili wa ${userName} mara moja?`)) {
            const reason = prompt('Sababu ya kughairi (hiari):');
            cancelSubscriptionAdminAction(userId, reason);
        }
    };

    async function cancelSubscriptionAdminAction(userId, reason) {
        try {
            const response = await api.adminCancelSubscriptionImmediately(userId, reason || undefined);
            if (response.success) {
                showToast('✅ Usajili umefutwa mara moja!');
                loadSubscriptions();
            } else {
                alert(`❌ ${response.message || 'Imeshindwa kughairi usajili'}`);
            }
        } catch (error) {
            console.error('Admin cancel subscription error:', error);
            alert(`❌ Error: ${error.message}`);
        }
    }

    // ===== Load Ratings =====
    async function loadRatings() {
        try {
            const response = await api.adminGetRatingStats();
            if (response.success && response.statistics) {
                renderRatings(response.statistics);
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            document.getElementById('ratingTotalRatings').textContent = 'Error';
            document.getElementById('ratingOverallAvg').textContent = '0.0';
            document.getElementById('ratingMoviesWithRatings').textContent = '0';
        }
    }

    function renderRatings(stats) {
        if (!stats) return;

        document.getElementById('ratingTotalRatings').textContent = stats.total_ratings || 0;
        document.getElementById('ratingOverallAvg').textContent = (stats.overall_average || 0).toFixed(1);
        document.getElementById('ratingMoviesWithRatings').textContent = stats.movies_with_ratings || 0;

        // Distribution
        const distContainer = document.getElementById('ratingDistribution');
        const distribution = stats.rating_distribution || [];
        if (distContainer) {
            if (distribution.length === 0) {
                distContainer.innerHTML = '<p style="color:#9aa2d7;">Hakuna data ya usambazaji</p>';
            } else {
                const total = distribution.reduce((sum, d) => sum + d.count, 0) || 1;
                distContainer.innerHTML = distribution.map(d => `
                    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.3rem;">
                        <span style="min-width:30px;font-weight:600;color:#f5f7ff;">${d.rating}</span>
                        <div style="flex:1;height:10px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;">
                            <div style="width:${(d.count / total) * 100}%;height:100%;background:linear-gradient(90deg,#6c63ff,#ff4eb0);border-radius:999px;transition:width 0.6s ease;"></div>
                        </div>
                        <span style="min-width:40px;color:#9aa2d7;font-size:0.85rem;">${d.count}</span>
                    </div>
                `).join('');
            }
        }

        // Movie table
        const movieTableBody = document.getElementById('ratingsMovieTableBody');
        const movies = stats.ratings_by_movie || [];
        if (movieTableBody) {
            if (movies.length === 0) {
                movieTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Hakuna movies zilizo na rating</td></tr>`;
            } else {
                movieTableBody.innerHTML = movies.slice(0, 50).map(m => `
                    <tr>
                        <td><strong>${m.title || 'Unknown'}</strong></td>
                        <td>${m.avg_rating?.toFixed(1) || '0.0'}/10</td>
                        <td>${m.total_ratings || m.rating_count || 0}</td>
                        <td>
                            <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;width:120px;">
                                <div style="width:${((m.avg_rating || 0) / 10) * 100}%;height:100%;background:linear-gradient(90deg,#6c63ff,#ff4eb0);border-radius:999px;"></div>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Top raters
        const topRatersContainer = document.getElementById('ratingTopRaters');
        const topRaters = stats.top_raters || [];
        if (topRatersContainer) {
            if (topRaters.length === 0) {
                topRatersContainer.innerHTML = '<p style="color:#9aa2d7;">Hakuna data ya watumizi wanaokadiria</p>';
            } else {
                topRatersContainer.innerHTML = topRaters.map(r => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.04);">
                        <div>
                            <strong style="color:#f5f7ff;">${r.full_name || 'Unknown'}</strong>
                            <span style="color:#9aa2d7;font-size:0.85rem;margin-left:0.5rem;">${r.email || ''}</span>
                        </div>
                        <div style="display:flex;gap:1rem;">
                            <span style="color:#9aa2d7;font-size:0.85rem;">${r.ratings_count || 0} ratings</span>
                            <span style="color:#fbbf24;">★ ${(r.avg_rating || 0).toFixed(1)}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // ===== Movies Stats =====
    async function renderMoviesStats() {
        try {
            const response = await api.adminGetMovieStats();
            if (response.success && response.stats) {
                const stats = response.stats;
                document.getElementById('statTotalMovies').textContent = stats.total_movies || 0;
                document.getElementById('statSingleMovies').textContent = stats.movies_by_type?.find(t => t.movie_type === 'single')?.count || 0;
                document.getElementById('statSeriesMovies').textContent = stats.movies_by_type?.find(t => t.movie_type === 'series')?.count || 0;
                document.getElementById('statRecentMovies').textContent = stats.recent_30_days || 0;
            }
        } catch (error) {
            console.warn('Error loading movie stats:', error);
        }
    }

    // ===== Users Stats =====
    async function renderUsersStats() {
        try {
            const response = await api.adminGetUserStats();
            if (response.success && response.stats) {
                const stats = response.stats;
                document.getElementById('statTotalUsers').textContent = stats.total_users || 0;
                document.getElementById('statHasWatched').textContent = stats.watch_activity?.has_watched || 0;
                document.getElementById('statNeverWatched').textContent = stats.watch_activity?.never_watched || 0;
                document.getElementById('statUsersWithPurchases').textContent = stats.purchases?.users_with_purchases || 0;
                document.getElementById('statTotalPurchases').textContent = stats.purchases?.total_purchases || 0;
                document.getElementById('statUserRevenue').textContent = `TSh ${(stats.purchases?.total_revenue || 0).toLocaleString()}`;
                document.getElementById('statWatchRate').textContent = `${stats.summary?.watch_rate || 0}%`;
                document.getElementById('statPurchaseRate').textContent = `${stats.summary?.purchase_rate || 0}%`;
                
                const countryContainer = document.getElementById('usersCountryStats');
                if (countryContainer && stats.users_by_country) {
                    countryContainer.innerHTML = stats.users_by_country.map(c => 
                        `<span class="country-tag">${c.country} <span class="count">(${c.count})</span></span>`
                    ).join(' ');
                }
                
                const newestContainer = document.getElementById('usersNewestList');
                if (newestContainer && stats.newest_users) {
                    newestContainer.innerHTML = `
                        <div class="newest-users-list">
                            ${stats.newest_users.map(u => `
                                <div class="newest-user-item">
                                    <div class="newest-user-avatar">${u.full_name?.charAt(0) || '?'}</div>
                                    <div class="newest-user-info">
                                        <div class="newest-user-name">${u.full_name}</div>
                                        <div class="newest-user-email">${u.email}</div>
                                    </div>
                                    <div class="newest-user-date">${new Date(u.created_at).toLocaleDateString('sw')}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.warn('Error loading user stats:', error);
        }
    }

    // ===== Toggle Stats =====
    const toggleStatsBtn = document.getElementById('toggleStatsBtn');
    const statsToggleLabel = document.getElementById('statsToggleLabel');
    const moviesStatsContainer = document.getElementById('moviesStatsContainer');

    if (toggleStatsBtn && statsToggleLabel && moviesStatsContainer) {
        toggleStatsBtn.addEventListener('click', function() {
            statsVisible = !statsVisible;
            moviesStatsContainer.style.display = statsVisible ? 'block' : 'none';
            statsToggleLabel.textContent = statsVisible ? 'Ficha Takwimu' : 'Onyesha Takwimu';
        });
    }

    const toggleUsersStatsBtn = document.getElementById('toggleUsersStatsBtn');
    const usersStatsToggleLabel = document.getElementById('usersStatsToggleLabel');
    const usersStatsContainer = document.getElementById('usersStatsContainer');

    if (toggleUsersStatsBtn && usersStatsToggleLabel && usersStatsContainer) {
        toggleUsersStatsBtn.addEventListener('click', function() {
            usersStatsVisible = !usersStatsVisible;
            usersStatsContainer.style.display = usersStatsVisible ? 'block' : 'none';
            usersStatsToggleLabel.textContent = usersStatsVisible ? 'Ficha Takwimu' : 'Onyesha Takwimu';
        });
    }

    // ===== Global Functions =====
    window.viewMovie = function(id) {
        const movie = moviesData.find(m => m.id === id);
        if (movie) {
            alert(`📽️ Jina: ${movie.title}\nAina: ${movie.movie_type}\nNchi: ${movie.country}\nLugha: ${movie.language}\nKategoria: ${movie.category}\nImetafsiriwa: ${movie.is_translated ? 'Ndiyo' : 'Hapana'}\nMwaka: ${movie.year}\nBei: TSh ${movie.price || 0}\nRating: ${movie.avg_rating?.toFixed(1) || 0}/10 (${movie.total_ratings || 0} ratings)`);
        }
    };

    window.editMovie = function(id) {
        const movie = moviesData.find(m => m.id === id);
        if (movie) {
            openMovieModal(movie);
        }
    };

    window.deleteMovie = function(id) {
        deleteTarget = id;
        deleteType = 'movie';
        document.getElementById('confirmMessage').textContent = 'Je, una uhakika unataka kufuta movie hii? Kitendo hiki hakiwezi kutenduliwa.';
        openModal('confirmModal');
    };

    window.viewUser = function(id) {
        const user = usersData.find(u => u.id === id);
        if (user) {
            alert(`👤 Jina: ${user.full_name}\nBarua pepe: ${user.email}\nSimu: ${user.phone || '-'}\nNchi: ${user.country || '-'}\nEneo: ${user.region || '-'}`);
        }
    };

    window.editUser = function(id) {
        const user = usersData.find(u => u.id === id);
        if (user) {
            openUserModal(user);
        }
    };

    window.deleteUser = function(id) {
        deleteTarget = id;
        deleteType = 'user';
        document.getElementById('confirmMessage').textContent = 'Je, una uhakika unataka kufuta mtumiaji huyu? Kitendo hiki hakiwezi kutenduliwa.';
        openModal('confirmModal');
    };

    // ===== Content Type Toggle =====
    function setupContentTypeToggle() {
        const radios = document.querySelectorAll('input[name="contentType"]');
        const singleFields = document.getElementById('singleMovieFields');
        const seriesFields = document.getElementById('seriesFields');
        const fileInput = document.getElementById('movieFile');

        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                const labels = document.querySelectorAll('.content-type-selector label');
                labels.forEach(label => label.classList.remove('selected'));
                this.closest('label').classList.add('selected');

                if (this.value === 'single') {
                    if (singleFields) singleFields.style.display = 'block';
                    if (seriesFields) seriesFields.classList.remove('visible');
                    if (fileInput) fileInput.required = true;
                } else {
                    if (singleFields) singleFields.style.display = 'none';
                    if (seriesFields) seriesFields.classList.add('visible');
                    if (fileInput) fileInput.required = false;
                }
            });
        });
    }

    // ===== Movie Modal =====
    function openMovieModal(movie = null) {
        const modal = document.getElementById('movieModal');
        const form = document.getElementById('movieForm');
        const title = document.getElementById('movieModalTitle');
        
        if (!modal || !form) return;

        form.reset();
        
        document.getElementById('movieId').value = '';
        document.getElementById('movieFile').required = true;
        document.getElementById('moviePoster').required = true;
        document.getElementById('seasonsContainer').innerHTML = '';
        seasonCounter = 0;
        episodeCounter = 0;

        document.querySelector('input[name="contentType"][value="single"]').checked = true;
        document.querySelectorAll('.content-type-selector label').forEach((label, idx) => {
            label.classList.toggle('selected', idx === 0);
        });
        document.getElementById('singleMovieFields').style.display = 'block';
        document.getElementById('seriesFields').classList.remove('visible');

        if (movie) {
            title.textContent = 'Hariri Movie';
            document.getElementById('movieId').value = movie.id;
            document.getElementById('movieTitle').value = movie.title || '';
            document.getElementById('movieCountry').value = movie.country || '';
            document.getElementById('movieLang').value = movie.language || '';
            document.getElementById('movieCategory').value = movie.category || '';
            document.getElementById('movieTranslated').value = movie.is_translated ? '1' : '0';
            document.getElementById('movieYear').value = movie.year || '';
            document.getElementById('moviePrice').value = movie.price || '';
            document.getElementById('movieDescription').value = movie.description || '';
            document.getElementById('movieDuration').value = movie.movie_time || '';

            const type = movie.movie_type || 'single';
            document.querySelector(`input[name="contentType"][value="${type}"]`).checked = true;
            document.querySelector(`input[name="contentType"][value="${type}"]`).dispatchEvent(new Event('change'));

            if (type === 'series' && movie.seasons) {
                movie.seasons.forEach(season => {
                    window.addSeason(season);
                });
            }

            document.getElementById('moviePoster').required = false;
            document.getElementById('movieFile').required = false;
        } else {
            title.textContent = 'Ongeza Movie';
            document.getElementById('movieTranslated').value = '0';
            document.getElementById('moviePoster').required = true;
            document.getElementById('movieFile').required = true;
            window.addSeason({ season_number: 1, episodes: [] });
        }

        populateMoreLikeSelect();

        if (movie && movie.more_like_this) {
            const select = document.getElementById('movieMoreLike');
            if (select) {
                movie.more_like_this.forEach(rec => {
                    const opt = Array.from(select.options).find(o => o.value == rec.id);
                    if (opt) opt.selected = true;
                });
            }
        }

        openModal('movieModal');
    }

    document.getElementById('addSeasonBtn')?.addEventListener('click', function() {
        window.addSeason({ season_number: document.querySelectorAll('.season-group').length + 1, episodes: [] });
    });

    // ===== Movie Form Submit =====
    document.getElementById('movieForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitMovieBtn');
        const id = document.getElementById('movieId')?.value || '';
        const contentType = document.querySelector('input[name="contentType"]:checked')?.value || 'single';
        
        setButtonLoading(submitBtn, true, id ? 'Inasasisha...' : 'Inaongeza...');
        
        const formData = new FormData();
        
        formData.append('title', document.getElementById('movieTitle').value.trim());
        formData.append('movie_type', contentType);
        formData.append('country', document.getElementById('movieCountry').value);
        formData.append('language', document.getElementById('movieLang').value.trim());
        formData.append('category', document.getElementById('movieCategory').value);
        formData.append('is_translated', document.getElementById('movieTranslated').value);
        formData.append('year', document.getElementById('movieYear').value);
        formData.append('price', document.getElementById('moviePrice').value);
        formData.append('description', document.getElementById('movieDescription').value.trim());
        
        if (document.getElementById('moviePoster').files[0]) {
            formData.append('poster', document.getElementById('moviePoster').files[0]);
        }
        
        const moreLikeSelect = document.getElementById('movieMoreLike');
        if (moreLikeSelect) {
            const values = Array.from(moreLikeSelect.selectedOptions).map(o => o.value).filter(v => v);
            values.forEach(val => formData.append('more_like_this', val));
        }
        
        if (contentType === 'single') {
            formData.append('movie_time', document.getElementById('movieDuration').value.trim());
            if (document.getElementById('movieFile').files[0]) {
                formData.append('video', document.getElementById('movieFile').files[0]);
            } else if (!id) {
                alert('❌ Tafadhali weka video ya movie.');
                setButtonLoading(submitBtn, false);
                return;
            }
        } else {
            const seasons = [];
            let epIdx = 0;
            
            document.querySelectorAll('.season-group').forEach((group, sIdx) => {
                const seasonNumber = parseInt(group.querySelector('.season-number-field')?.value) || sIdx + 1;
                const seasonName = group.querySelector('.season-name-field')?.value.trim() || `Season ${seasonNumber}`;
                
                const episodes = [];
                group.querySelectorAll('.episode-item').forEach((item) => {
                    const epNumber = parseInt(item.querySelector('.episode-number')?.value) || episodes.length + 1;
                    const epTitle = item.querySelector('.episode-title')?.value.trim() || `Episode ${epNumber}`;
                    const duration = item.querySelector('.episode-duration')?.value.trim() || '';
                    
                    const videoInput = item.querySelector('.episode-video');
                    if (videoInput?.files?.[0]) {
                        formData.append(`episodes_${epIdx}`, videoInput.files[0]);
                        epIdx++;
                    } else if (!id) {
                        alert(`❌ Tafadhali weka video kwa Episode ${epNumber} katika Season ${seasonNumber}.`);
                        setButtonLoading(submitBtn, false);
                        return;
                    }
                    
                    episodes.push({ episode_number: epNumber, episode_title: epTitle, duration: duration });
                });
                
                if (episodes.length === 0) {
                    episodes.push({ episode_number: 1, episode_title: 'Episode 1', duration: '' });
                }
                
                seasons.push({ season_number: seasonNumber, season_name: seasonName, episodes: episodes });
            });
            
            if (seasons.length === 0) {
                alert('❌ Tafadhali ongeza angalau season moja kwa series.');
                setButtonLoading(submitBtn, false);
                return;
            }
            
            if (!id) {
                let totalVideos = 0;
                formData.forEach((value, key) => { if (key.startsWith('episodes_') && value instanceof File) totalVideos++; });
                let totalEpisodes = 0;
                seasons.forEach(s => totalEpisodes += s.episodes.length);
                if (totalVideos < totalEpisodes) {
                    alert(`❌ Tafadhali weka video kwa kila episode. Zimegundulika ${totalVideos} video, lakini kuna ${totalEpisodes} episodes.`);
                    setButtonLoading(submitBtn, false);
                    return;
                }
            }
            
            formData.append('seasons', JSON.stringify(seasons));
        }
        
        try {
            const response = id ? await api.adminUpdateMovie(id, formData) : await api.adminCreateMovie(formData);
            setButtonLoading(submitBtn, false);
            if (response.success) {
                showToast(id ? '✅ Movie imesasishwa!' : '✅ Movie imeongezwa!');
                closeModal('movieModal');
                loadMovies();
            } else {
                alert(`❌ ${response.message || 'Operation failed'}`);
            }
        } catch (error) {
            setButtonLoading(submitBtn, false);
            alert(`❌ Error: ${error.message}`);
        }
    });

    // ===== Add Movie Button =====
    document.getElementById('addMovieBtn')?.addEventListener('click', function() {
        openMovieModal(null);
    });

    // ===== User Modal =====
    function openUserModal(user = null) {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (!modal || !form) return;

        form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPhotoPreview').style.display = 'none';

        if (user) {
            title.textContent = 'Hariri Mtumiaji';
            document.getElementById('userId').value = user.id;
            document.getElementById('userFullName').value = user.full_name || '';
            document.getElementById('userPhone').value = user.phone || '';
            document.getElementById('userCountry').value = user.country || '';
            document.getElementById('userRegion').value = user.region || '';
            document.getElementById('userEmail').value = user.email || '';
            
            if (user.profile_image) {
                document.getElementById('userCurrentPhoto').src = user.profile_image;
                document.getElementById('userPhotoPreview').style.display = 'block';
            }
            
            document.getElementById('userPassword').placeholder = 'Acha tupu ili kubaki sawa';
            document.getElementById('userPassword').required = false;
            document.getElementById('userPasswordConfirm').placeholder = 'Acha tupu ili kubaki sawa';
            document.getElementById('userPasswordConfirm').required = false;
        } else {
            title.textContent = 'Ongeza Mtumiaji';
            document.getElementById('userPassword').required = true;
            document.getElementById('userPassword').placeholder = 'Weka nenosiri (herufi 6 au zaidi)';
            document.getElementById('userPasswordConfirm').required = true;
            document.getElementById('userPasswordConfirm').placeholder = 'Rudia nenosiri';
            document.getElementById('userPhotoPreview').style.display = 'none';
        }

        const regionGroup = document.getElementById('userRegionGroup');
        if (document.getElementById('userCountry').value === 'Tanzania') {
            regionGroup.style.display = 'block';
        } else {
            regionGroup.style.display = 'none';
        }

        openModal('userModal');
    }

    document.getElementById('userCountry')?.addEventListener('change', function() {
        document.getElementById('userRegionGroup').style.display = this.value === 'Tanzania' ? 'block' : 'none';
    });

    document.getElementById('addUserBtn')?.addEventListener('click', function() {
        openUserModal(null);
    });

    // ===== User Form Submit =====
    document.getElementById('userForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitUserBtn');
        const id = document.getElementById('userId')?.value || '';
        
        const full_name = document.getElementById('userFullName').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        let country = document.getElementById('userCountry').value;
        const region = document.getElementById('userRegion').value;
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;
        const confirmPassword = document.getElementById('userPasswordConfirm').value;
        const photoInput = document.getElementById('userPhoto');

        let missingFields = [];
        if (!full_name) missingFields.push('Jina kamili');
        if (!phone) missingFields.push('Namba ya simu');
        if (!country) missingFields.push('Nchi');
        if (!email) missingFields.push('Barua pepe');
        
        if (!id) {
            if (!password || password.length < 6) {
                alert('❌ Nenosiri lazima iwe na herufi 6 au zaidi!');
                return;
            }
            if (password !== confirmPassword) {
                alert('❌ Nenosiri hazilingani!');
                return;
            }
        } else {
            if (password && password.length < 6) {
                alert('❌ Nenosiri lazima iwe na herufi 6 au zaidi!');
                return;
            }
            if (password && password !== confirmPassword) {
                alert('❌ Nenosiri hazilingani!');
                return;
            }
        }
        
        if (missingFields.length > 0) {
            alert(`❌ Tafadhali jaza sehemu zifuatazo:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setButtonLoading(submitBtn, true, id ? 'Inasasisha...' : 'Inaongeza...');

        try {
            let response;
            if (id) {
                const formData = new FormData();
                formData.append('full_name', full_name);
                formData.append('phone', phone);
                formData.append('country', country);
                formData.append('region', region || '');
                formData.append('email', email);
                if (password) {
                    formData.append('password', password);
                    formData.append('confirmPassword', confirmPassword);
                }
                if (photoInput?.files?.[0]) {
                    formData.append('profile_image', photoInput.files[0]);
                }
                response = await api.adminUpdateUser(id, formData);
            } else {
                const userData = { full_name, phone, country, region, email, password, confirmPassword };
                if (photoInput?.files?.[0]) {
                    userData.profile_image = photoInput.files[0];
                }
                response = await api.adminCreateUser(userData);
            }
            
            setButtonLoading(submitBtn, false);
            if (response.success) {
                showToast(id ? '✅ Mtumiaji amesasishwa!' : '✅ Mtumiaji ameongezwa!');
                closeModal('userModal');
                loadUsers();
            } else {
                alert(`❌ ${response.message || 'Operation failed'}`);
            }
        } catch (error) {
            setButtonLoading(submitBtn, false);
            alert(`❌ Error: ${error.message}`);
        }
    });

    // ===== Confirm Delete =====
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async function() {
        const btn = this;
        setButtonLoading(btn, true, 'Inafuta...');
        
        try {
            let response;
            if (deleteType === 'movie') {
                response = await api.adminDeleteMovie(deleteTarget);
                if (response.success) { showToast('✅ Movie imefutwa!'); loadMovies(); }
                else alert(`❌ ${response.message || 'Delete failed'}`);
            } else if (deleteType === 'user') {
                response = await api.adminDeleteUser(deleteTarget);
                if (response.success) { showToast('✅ Mtumiaji amefutwa!'); loadUsers(); }
                else alert(`❌ ${response.message || 'Delete failed'}`);
            }
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
        
        setButtonLoading(btn, false);
        deleteTarget = null;
        deleteType = null;
        closeModal('confirmModal');
    });

    // ===== Modal Helpers =====
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.style.display = 'none';
            }
        });
    });

    // ===== Toast =====
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: rgba(12, 17, 37, 0.95);
            border: 1px solid rgba(108, 99, 255, 0.3);
            border-radius: 14px;
            color: var(--text-primary);
            font-weight: 600;
            backdrop-filter: blur(18px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            z-index: 2000;
            animation: fadeSlideUp 0.3s ease;
            max-width: 90%;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== Initialize =====
    setupContentTypeToggle();
    
    // Get initial tab from URL hash
    const initialTab = getTabFromHash();
    switchTab(initialTab);

    try {
        const user = auth.getUser();
        if (user?.email) {
            document.getElementById('adminEmail').textContent = user.email;
        }
    } catch (e) {}

    console.log('🔐 Admin Panel Loaded');
});