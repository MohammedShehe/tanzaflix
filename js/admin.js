// js/admin.js - Admin Panel with Ratings Tab

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

// ===== Global Season/Episode Functions (for inline onclick) =====
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
    
    // If we have episode data, add them
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
    const seasonNumber = document.querySelector(`.season-group[data-season-id="${seasonId}"]`)?.dataset?.seasonNumber || 1;
    
    // Generate field name for the backend: episodes_{seasonIndex}_{episodeIndex}
    // Or simpler: episodes_0, episodes_1, episodes_2, etc.
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
    
    // Add file change listener to update status
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

// ===== Set Button Loading State =====
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
    // Check admin session
    if (!auth.checkAuth() || !auth.checkAdmin()) return;

    // ===== State =====
    let currentTab = 'movies';
    let deleteTarget = null;
    let deleteType = null;
    let statsVisible = true;
    let usersStatsVisible = true;
    let moviesData = [];
    let usersData = [];
    let ratingsData = [];

    // ===== DOM Elements =====
    const tabs = document.querySelectorAll('.nav-item');
    const tabContents = {
        movies: document.getElementById('moviesTab'),
        users: document.getElementById('usersTab'),
        transactions: document.getElementById('transactionsTab'),
        activities: document.getElementById('activitiesTab'),
        ratings: document.getElementById('ratingsTab'),
    };

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
            if (tabName === 'activities') {
                window.location.href = 'admin-activities.html';
                return;
            }
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            Object.keys(tabContents).forEach(key => {
                if (tabContents[key]) {
                    tabContents[key].classList.remove('active');
                }
            });
            if (tabContents[tabName]) {
                tabContents[tabName].classList.add('active');
            }
            currentTab = tabName;
            if (tabName === 'movies') loadMovies();
            else if (tabName === 'users') loadUsers();
            else if (tabName === 'transactions') loadTransactions();
            else if (tabName === 'ratings') loadRatings();
        });
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

        const totalIncomeEl = document.getElementById('totalIncome');
        const completedEl = document.getElementById('completedTransactions');
        const pendingEl = document.getElementById('pendingTransactions');
        const customersEl = document.getElementById('totalCustomers');
        
        if (totalIncomeEl) totalIncomeEl.textContent = `TSh ${totalIncome.toLocaleString()}`;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;
        if (customersEl) customersEl.textContent = customers;

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
                <td>
                    ${p.status === 'processing' || p.status === 'pending' ? 
                        `<button class="action-btn action-btn-edit" onclick="window.confirmTransaction(${p.id})"><i class="fas fa-check"></i></button>` : ''}
                    <button class="action-btn action-btn-delete" onclick="window.deleteTransaction(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    // ===== Load Ratings =====
    async function loadRatings() {
        try {
            const response = await api.adminGetRatingStats();
            if (response.success && response.statistics) {
                ratingsData = response.statistics;
                renderRatings();
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            const tbody = document.getElementById('ratingsTableBody');
            if (tbody) {
                tbody.innerHTML = 
                    `<tr><td colspan="6" class="empty-state">Error loading ratings: ${error.message}</td></tr>`;
            }
        }
    }

    function renderRatings() {
        const stats = ratingsData;
        if (!stats) return;

        const ratingTotalEl = document.getElementById('ratingTotalRatings');
        const ratingAvgEl = document.getElementById('ratingOverallAvg');
        const ratingMoviesEl = document.getElementById('ratingMoviesWithRatings');
        
        if (ratingTotalEl) ratingTotalEl.textContent = stats.total_ratings || 0;
        if (ratingAvgEl) ratingAvgEl.textContent = (stats.overall_average || 0).toFixed(1);
        if (ratingMoviesEl) ratingMoviesEl.textContent = stats.movies_with_ratings || 0;

        const distributionContainer = document.getElementById('ratingDistribution');
        const distribution = stats.rating_distribution || [];
        if (distributionContainer) {
            if (distribution.length === 0) {
                distributionContainer.innerHTML = '<p style="color:#9aa2d7;">Hakuna data ya usambazaji</p>';
            } else {
                distributionContainer.innerHTML = distribution.map(d => `
                    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.3rem;">
                        <span style="min-width:30px;font-weight:600;color:#f5f7ff;">${d.rating}</span>
                        <div style="flex:1;height:10px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;">
                            <div style="width:${(d.count / (stats.total_ratings || 1)) * 100}%;height:100%;background:linear-gradient(90deg,#6c63ff,#ff4eb0);border-radius:999px;transition:width 0.6s ease;"></div>
                        </div>
                        <span style="min-width:40px;color:#9aa2d7;font-size:0.85rem;">${d.count}</span>
                    </div>
                `).join('');
            }
        }

        const movieTableBody = document.getElementById('ratingsMovieTableBody');
        const movies = stats.ratings_by_movie || [];
        if (movieTableBody) {
            if (movies.length === 0) {
                movieTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Hakuna movies zilizo na rating</td></tr>`;
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
                        <td>${m.category || '-'}</td>
                        <td>
                            <button class="action-btn action-btn-view" onclick="window.viewMovieRatings(${m.id})"><i class="fas fa-star"></i></button>
                        </td>
                    </tr>
                `).join('');
            }
        }

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
                const elMap = {
                    'statTotalMovies': stats.total_movies || 0,
                    'statSingleMovies': stats.movies_by_type?.find(t => t.movie_type === 'single')?.count || 0,
                    'statSeriesMovies': stats.movies_by_type?.find(t => t.movie_type === 'series')?.count || 0,
                    'statRecentMovies': stats.recent_30_days || 0,
                    'statTotalSeasons': stats.series_stats?.total_seasons || 0,
                    'statTotalEpisodes': stats.series_stats?.total_episodes || 0,
                    'statAvgPrice': `TSh ${Math.round(stats.price_distribution?.find(p => p.price_type === 'Paid')?.avg_price || 0).toLocaleString()}`,
                    'statPaidMovies': stats.price_distribution?.find(p => p.price_type === 'Paid')?.count || 0
                };
                Object.keys(elMap).forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = elMap[id];
                });
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
                const elMap = {
                    'statTotalUsers': stats.total_users || 0,
                    'statHasWatched': stats.watch_activity?.has_watched || 0,
                    'statNeverWatched': stats.watch_activity?.never_watched || 0,
                    'statUsersWithPurchases': stats.purchases?.users_with_purchases || 0,
                    'statTotalPurchases': stats.purchases?.total_purchases || 0,
                    'statUserRevenue': `TSh ${(stats.purchases?.total_revenue || 0).toLocaleString()}`,
                    'statWatchRate': `${stats.summary?.watch_rate || 0}%`,
                    'statPurchaseRate': `${stats.summary?.purchase_rate || 0}%`,
                    'statRepeatCustomers': stats.users_with_multiple_purchases || 0,
                    'statAvgSpend': `TSh ${Math.round(stats.avg_spend_per_user || 0).toLocaleString()}`
                };
                Object.keys(elMap).forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = elMap[id];
                });
                
                const countryContainer = document.getElementById('usersCountryStats');
                if (countryContainer && stats.users_by_country && stats.users_by_country.length > 0) {
                    countryContainer.innerHTML = stats.users_by_country.map(c => 
                        `<span class="country-tag">${c.country} <span class="count">(${c.count})</span></span>`
                    ).join(' ');
                }
                
                const newestContainer = document.getElementById('usersNewestList');
                if (newestContainer && stats.newest_users && stats.newest_users.length > 0) {
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

    // ===== Toggle Stats Visibility =====
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
            alert(`📽️ Jina: ${movie.title}\nAina: ${movie.movie_type}\nNchi: ${movie.country}\nLugha: ${movie.language}\nKategoria: ${movie.category}\nImetafsiriwa: ${movie.is_translated ? 'Ndiyo' : 'Hapana'}\nMwaka: ${movie.year}\nBei: TSh ${movie.price || 0}\nRating: ${movie.avg_rating?.toFixed(1) || 0}/10 (${movie.total_ratings || 0} ratings)\nMaelezo: ${movie.description || '-'}`);
        }
    };

    window.viewMovieRatings = function(id) {
        const movie = moviesData.find(m => m.id === id);
        if (movie) {
            const ratingsTab = document.querySelector('[data-tab="ratings"]');
            if (ratingsTab) ratingsTab.click();
            setTimeout(() => {
                const rows = document.querySelectorAll('#ratingsMovieTableBody tr');
                rows.forEach(row => {
                    if (row.textContent.includes(movie.title)) {
                        row.style.background = 'rgba(108,99,255,0.15)';
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            row.style.background = '';
                        }, 3000);
                    }
                });
            }, 300);
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
        const msgEl = document.getElementById('confirmMessage');
        if (msgEl) {
            msgEl.textContent = 'Je, una uhakika unataka kufuta movie hii? Kitendo hiki hakiwezi kutenduliwa.';
        }
        openModal('confirmModal');
    };

    window.viewUser = function(id) {
        const user = usersData.find(u => u.id === id);
        if (user) {
            alert(`👤 Jina: ${user.full_name}\nBarua pepe: ${user.email}\nSimu: ${user.phone || '-'}\nNchi: ${user.country || '-'}\nEneo: ${user.region || '-'}\nAmeangalia: ${user.has_watched_before ? 'Ndiyo' : 'Hapana'}`);
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
        const msgEl = document.getElementById('confirmMessage');
        if (msgEl) {
            msgEl.textContent = 'Je, una uhakika unataka kufuta mtumiaji huyu? Kitendo hiki hakiwezi kutenduliwa.';
        }
        openModal('confirmModal');
    };

    window.confirmTransaction = function(id) {
        alert('Transaction confirmed!');
        loadTransactions();
    };

    window.deleteTransaction = function(id) {
        if (confirm('Je, una uhakika unataka kufuta transaction hii?')) {
            alert('Transaction deleted!');
            loadTransactions();
        }
    };

    // ===== Content Type Toggle =====
    function setupContentTypeToggle() {
        const radios = document.querySelectorAll('input[name="contentType"]');
        const singleFields = document.getElementById('singleMovieFields');
        const seriesFields = document.getElementById('seriesFields');
        const durationGroup = document.getElementById('movieTimeGroup');
        const fileInput = document.getElementById('movieFile');

        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                const labels = document.querySelectorAll('.content-type-selector label');
                labels.forEach(label => label.classList.remove('selected'));
                this.closest('label').classList.add('selected');

                if (this.value === 'single') {
                    if (singleFields) singleFields.style.display = 'block';
                    if (seriesFields) seriesFields.classList.remove('visible');
                    if (durationGroup) durationGroup.style.display = 'block';
                    if (fileInput) fileInput.required = true;
                } else {
                    if (singleFields) singleFields.style.display = 'none';
                    if (seriesFields) seriesFields.classList.add('visible');
                    if (durationGroup) durationGroup.style.display = 'none';
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

        // Reset form
        form.reset();
        
        const movieIdInput = document.getElementById('movieId');
        const movieFileInput = document.getElementById('movieFile');
        const moviePosterInput = document.getElementById('moviePoster');
        const seasonsContainer = document.getElementById('seasonsContainer');
        
        if (movieIdInput) movieIdInput.value = '';
        if (movieFileInput) movieFileInput.required = true;
        if (moviePosterInput) moviePosterInput.required = true;
        
        if (seasonsContainer) {
            seasonsContainer.innerHTML = '';
        }
        seasonCounter = 0;
        episodeCounter = 0;

        // Set default content type
        const singleRadio = document.querySelector('input[name="contentType"][value="single"]');
        if (singleRadio) {
            singleRadio.checked = true;
            singleRadio.dispatchEvent(new Event('change'));
        }
        
        const labels = document.querySelectorAll('.content-type-selector label');
        labels.forEach((label, idx) => {
            label.classList.toggle('selected', idx === 0);
        });
        
        const singleFields = document.getElementById('singleMovieFields');
        const seriesFields = document.getElementById('seriesFields');
        const durationGroup = document.getElementById('movieTimeGroup');
        
        if (singleFields) singleFields.style.display = 'block';
        if (seriesFields) seriesFields.classList.remove('visible');
        if (durationGroup) durationGroup.style.display = 'block';

        if (movie) {
            if (title) title.textContent = 'Hariri Movie';
            if (movieIdInput) movieIdInput.value = movie.id;
            
            const titleInput = document.getElementById('movieTitle');
            const countrySelect = document.getElementById('movieCountry');
            const langInput = document.getElementById('movieLang');
            const categorySelect = document.getElementById('movieCategory');
            const translatedSelect = document.getElementById('movieTranslated');
            const yearInput = document.getElementById('movieYear');
            const priceInput = document.getElementById('moviePrice');
            const descTextarea = document.getElementById('movieDescription');
            const durationInput = document.getElementById('movieDuration');
            
            if (titleInput) titleInput.value = movie.title || '';
            if (countrySelect) countrySelect.value = movie.country || '';
            if (langInput) langInput.value = movie.language || '';
            if (categorySelect) categorySelect.value = movie.category || '';
            if (translatedSelect) translatedSelect.value = movie.is_translated ? '1' : '0';
            if (yearInput) yearInput.value = movie.year || '';
            if (priceInput) priceInput.value = movie.price || '';
            if (descTextarea) descTextarea.value = movie.description || '';
            if (durationInput) durationInput.value = movie.movie_time || '';

            const type = movie.movie_type || 'single';
            const radio = document.querySelector(`input[name="contentType"][value="${type}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }

            if (type === 'series' && movie.seasons) {
                movie.seasons.forEach(season => {
                    window.addSeason(season);
                });
            }

            if (moviePosterInput) moviePosterInput.required = false;
            if (movieFileInput) movieFileInput.required = false;
        } else {
            if (title) title.textContent = 'Ongeza Movie';
            if (moviePosterInput) moviePosterInput.required = true;
            if (movieFileInput) movieFileInput.required = true;
            
            const translatedSelect = document.getElementById('movieTranslated');
            if (translatedSelect) translatedSelect.value = '0';
            
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

    // ===== Add Season Button =====
    const addSeasonBtn = document.getElementById('addSeasonBtn');
    if (addSeasonBtn) {
        addSeasonBtn.addEventListener('click', function() {
            window.addSeason({ season_number: document.querySelectorAll('.season-group').length + 1, episodes: [] });
        });
    }

    // ===== Movie Form Submit =====
    const movieForm = document.getElementById('movieForm');
    if (movieForm) {
        movieForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitMovieBtn');
            const id = document.getElementById('movieId')?.value || '';
            const contentType = document.querySelector('input[name="contentType"]:checked')?.value || 'single';
            
            // Show loading state
            setButtonLoading(submitBtn, true, id ? 'Inasasisha...' : 'Inaongeza...');
            
            const formData = new FormData();
            
            const titleInput = document.getElementById('movieTitle');
            const countrySelect = document.getElementById('movieCountry');
            const langInput = document.getElementById('movieLang');
            const categorySelect = document.getElementById('movieCategory');
            const translatedSelect = document.getElementById('movieTranslated');
            const yearInput = document.getElementById('movieYear');
            const priceInput = document.getElementById('moviePrice');
            const descTextarea = document.getElementById('movieDescription');
            const posterInput = document.getElementById('moviePoster');
            const durationInput = document.getElementById('movieDuration');
            const videoInput = document.getElementById('movieFile');
            
            formData.append('title', titleInput ? titleInput.value.trim() : '');
            formData.append('movie_type', contentType);
            formData.append('country', countrySelect ? countrySelect.value : '');
            formData.append('language', langInput ? langInput.value.trim() : '');
            formData.append('category', categorySelect ? categorySelect.value : '');
            formData.append('is_translated', translatedSelect ? translatedSelect.value : '0');
            formData.append('year', yearInput ? yearInput.value : '');
            formData.append('price', priceInput ? priceInput.value : '');
            formData.append('description', descTextarea ? descTextarea.value.trim() : '');
            
            if (posterInput && posterInput.files[0]) {
                formData.append('poster', posterInput.files[0]);
            }
            
            const moreLikeSelect = document.getElementById('movieMoreLike');
            if (moreLikeSelect) {
                const moreLikeValues = Array.from(moreLikeSelect.selectedOptions).map(o => o.value).filter(v => v);
                if (moreLikeValues.length > 0) {
                    moreLikeValues.forEach(val => {
                        formData.append('more_like_this', val);
                    });
                }
            }
            
            if (contentType === 'single') {
                formData.append('movie_time', durationInput ? durationInput.value.trim() : '');
                
                if (videoInput && videoInput.files[0]) {
                    formData.append('video', videoInput.files[0]);
                } else if (!id) {
                    alert('❌ Tafadhali weka video ya movie.');
                    setButtonLoading(submitBtn, false);
                    return;
                }
            } else {
                // Series - collect seasons, episodes, and video files
                const seasons = [];
                const seasonGroups = document.querySelectorAll('.season-group');
                
                // Track episode index for file naming
                let epIdx = 0;
                
                seasonGroups.forEach((group, sIdx) => {
                    const seasonNumberField = group.querySelector('.season-number-field');
                    const seasonNameField = group.querySelector('.season-name-field');
                    const seasonNumber = seasonNumberField ? parseInt(seasonNumberField.value) || sIdx + 1 : sIdx + 1;
                    const seasonName = seasonNameField ? seasonNameField.value.trim() || `Season ${seasonNumber}` : `Season ${seasonNumber}`;
                    
                    const episodes = [];
                    const episodeItems = group.querySelectorAll('.episode-item');
                    
                    episodeItems.forEach((item) => {
                        const epNumberInput = item.querySelector('.episode-number');
                        const epTitleInput = item.querySelector('.episode-title');
                        const epDurationInput = item.querySelector('.episode-duration');
                        const epVideoInput = item.querySelector('.episode-video');
                        
                        const epNumber = epNumberInput ? parseInt(epNumberInput.value) || episodes.length + 1 : episodes.length + 1;
                        const epTitle = epTitleInput ? epTitleInput.value.trim() || `Episode ${epNumber}` : `Episode ${epNumber}`;
                        const duration = epDurationInput ? epDurationInput.value.trim() || '' : '';
                        
                        // IMPORTANT: Add video file with field name episodes_{epIdx}
                        if (epVideoInput && epVideoInput.files && epVideoInput.files[0]) {
                            const fieldName = `episodes_${epIdx}`;
                            formData.append(fieldName, epVideoInput.files[0]);
                            epIdx++;
                        } else if (!id) {
                            // For new series, video is required for each episode
                            alert(`❌ Tafadhali weka video kwa Episode ${epNumber} katika Season ${seasonNumber}.`);
                            setButtonLoading(submitBtn, false);
                            return;
                        }
                        
                        episodes.push({
                            episode_number: epNumber,
                            episode_title: epTitle,
                            duration: duration
                        });
                    });
                    
                    if (episodes.length === 0) {
                        episodes.push({
                            episode_number: 1,
                            episode_title: `Episode 1`,
                            duration: ''
                        });
                    }
                    
                    seasons.push({
                        season_number: seasonNumber,
                        season_name: seasonName,
                        episodes: episodes
                    });
                });
                
                if (seasons.length === 0) {
                    alert('❌ Tafadhali ongeza angalau season moja kwa series.');
                    setButtonLoading(submitBtn, false);
                    return;
                }
                
                // Check if any episodes are missing videos for new series
                if (!id) {
                    // Count total video files added
                    let totalVideos = 0;
                    formData.forEach((value, key) => {
                        if (key.startsWith('episodes_') && value instanceof File) {
                            totalVideos++;
                        }
                    });
                    
                    // Count total episodes
                    let totalEpisodes = 0;
                    seasons.forEach(s => {
                        totalEpisodes += s.episodes.length;
                    });
                    
                    if (totalVideos < totalEpisodes) {
                        alert(`❌ Tafadhali weka video kwa kila episode. Zimegundulika ${totalVideos} video, lakini kuna ${totalEpisodes} episodes.`);
                        setButtonLoading(submitBtn, false);
                        return;
                    }
                }
                
                formData.append('seasons', JSON.stringify(seasons));
            }
            
            try {
                let response;
                if (id) {
                    response = await api.adminUpdateMovie(id, formData);
                } else {
                    response = await api.adminCreateMovie(formData);
                }
                
                setButtonLoading(submitBtn, false);
                
                if (response.success) {
                    showToast(id ? '✅ Movie imesasishwa!' : '✅ Movie imeongezwa!');
                    closeModal('movieModal');
                    loadMovies();
                } else {
                    alert(`❌ ${response.message || 'Operation failed'}`);
                }
            } catch (error) {
                console.error('Error saving movie:', error);
                setButtonLoading(submitBtn, false);
                alert(`❌ Error: ${error.message}`);
            }
        });
    }

    // ===== Add Movie Button =====
    const addMovieBtn = document.getElementById('addMovieBtn');
    if (addMovieBtn) {
        addMovieBtn.addEventListener('click', function() {
            openMovieModal(null);
        });
    }

    // ===== User Modal =====
    function openUserModal(user = null) {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (!modal || !form) return;

        if (user) {
            if (title) title.textContent = 'Hariri Mtumiaji';
            
            const userIdInput = document.getElementById('userId');
            const fullNameInput = document.getElementById('userFullName');
            const phoneInput = document.getElementById('userPhone');
            const countrySelect = document.getElementById('userCountry');
            const regionSelect = document.getElementById('userRegion');
            const emailInput = document.getElementById('userEmail');
            const passwordInput = document.getElementById('userPassword');
            const passwordConfirmInput = document.getElementById('userPasswordConfirm');
            
            if (userIdInput) userIdInput.value = user.id;
            if (fullNameInput) fullNameInput.value = user.full_name;
            if (phoneInput) phoneInput.value = user.phone || '';
            if (countrySelect) countrySelect.value = user.country || '';
            if (regionSelect) regionSelect.value = user.region || '';
            if (emailInput) emailInput.value = user.email;
            if (passwordInput) passwordInput.value = '';
            if (passwordConfirmInput) passwordConfirmInput.value = '';
            if (passwordInput) passwordInput.placeholder = 'Acha tupu ili kubaki sawa';
            if (passwordConfirmInput) passwordConfirmInput.placeholder = 'Acha tupu ili kubaki sawa';
        } else {
            if (title) title.textContent = 'Ongeza Mtumiaji';
            form.reset();
            
            const userIdInput = document.getElementById('userId');
            const passwordInput = document.getElementById('userPassword');
            const passwordConfirmInput = document.getElementById('userPasswordConfirm');
            
            if (userIdInput) userIdInput.value = '';
            if (passwordInput) passwordInput.placeholder = 'Weka nenosiri';
            if (passwordConfirmInput) passwordConfirmInput.placeholder = 'Rudia nenosiri';
        }

        openModal('userModal');
    }

    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            openUserModal(null);
        });
    }

    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitUserBtn');
            const id = document.getElementById('userId')?.value || '';
            const password = document.getElementById('userPassword')?.value || '';
            const passwordConfirm = document.getElementById('userPasswordConfirm')?.value || '';

            if (!id && (!password || password !== passwordConfirm)) {
                alert('Nenosiri hazilingani!');
                return;
            }

            if (!id && password.length < 6) {
                alert('Nenosiri lazima iwe na herufi 6 au zaidi!');
                return;
            }

            setButtonLoading(submitBtn, true, id ? 'Inasasisha...' : 'Inaongeza...');

            const data = {
                full_name: document.getElementById('userFullName')?.value.trim() || '',
                phone: document.getElementById('userPhone')?.value.trim() || '',
                country: document.getElementById('userCountry')?.value || '',
                region: document.getElementById('userRegion')?.value || '',
                email: document.getElementById('userEmail')?.value.trim() || '',
            };

            if (password) {
                data.password = password;
                data.confirmPassword = passwordConfirm;
            }

            try {
                let response;
                if (id) {
                    response = await api.adminUpdateUser(id, data);
                } else {
                    response = await api.adminCreateUser(data);
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
                console.error('Error saving user:', error);
                setButtonLoading(submitBtn, false);
                alert(`❌ Error: ${error.message}`);
            }
        });
    }

    // ===== Confirm Delete =====
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            const btn = this;
            setButtonLoading(btn, true, 'Inafuta...');
            
            try {
                if (deleteType === 'movie') {
                    const response = await api.adminDeleteMovie(deleteTarget);
                    if (response.success) {
                        showToast('✅ Movie imefutwa!');
                        loadMovies();
                    } else {
                        alert(`❌ ${response.message || 'Delete failed'}`);
                    }
                } else if (deleteType === 'user') {
                    const response = await api.adminDeleteUser(deleteTarget);
                    if (response.success) {
                        showToast('✅ Mtumiaji amefutwa!');
                        loadUsers();
                    } else {
                        alert(`❌ ${response.message || 'Delete failed'}`);
                    }
                }
            } catch (error) {
                console.error('Error deleting:', error);
                alert(`❌ Error: ${error.message}`);
            }
            
            setButtonLoading(btn, false);
            deleteTarget = null;
            deleteType = null;
            closeModal('confirmModal');
        });
    }

    // ===== Modal Helpers =====
    // Modal close handlers for backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.style.display = 'none';
            }
        });
    });

    // ===== Toast Notification =====
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
    loadMovies();
    loadUsers();
    loadTransactions();

    try {
        const user = auth.getUser();
        if (user && user.email) {
            const emailEl = document.getElementById('adminEmail');
            if (emailEl) emailEl.textContent = user.email;
        }
    } catch (e) {}

    console.log('🔐 Admin Panel Loaded');
});