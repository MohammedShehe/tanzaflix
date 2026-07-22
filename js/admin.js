// js/admin.js - Admin Panel with Ratings Tab

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check admin session
    if (!auth.checkAuth() || !auth.checkAdmin()) return;

    // ===== State =====
    let currentTab = 'movies';
    let deleteTarget = null;
    let deleteType = null;
    let seasonCounter = 0;
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

    adminProfile.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!adminProfile.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // ===== Logout =====
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Je, una uhakika unataka kuondoka?')) {
            auth.logout();
        }
    });

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
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            document.getElementById('moviesTableBody').innerHTML = 
                `<tr><td colspan="8" class="empty-state">Error loading movies: ${error.message}</td></tr>`;
        }
    }

    function renderMovies() {
        const tbody = document.getElementById('moviesTableBody');
        if (!moviesData.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hakuna movies zilizosajiliwa</td></tr>`;
            return;
        }
        tbody.innerHTML = moviesData.map(m => {
            const contentTypeBadge = m.movie_type === 'series' 
                ? '<span class="badge-series">📺 Series</span>' 
                : '<span class="badge-single">🎬 Single</span>';
            const ratingDisplay = m.total_ratings > 0 
                ? `${m.avg_rating?.toFixed(1) || 0}/10 (${m.total_ratings})`
                : 'Hakuna rating';
            return `
            <tr>
                <td><strong>${m.title}</strong> ${contentTypeBadge}</td>
                <td>${m.language || 'Unknown'}</td>
                <td>${m.country || '-'}</td>
                <td>${m.category || '-'}</td>
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
            document.getElementById('usersTableBody').innerHTML = 
                `<tr><td colspan="7" class="empty-state">Error loading users: ${error.message}</td></tr>`;
        }
    }

    function renderUsers() {
        const tbody = document.getElementById('usersTableBody');
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
            document.getElementById('transactionsTableBody').innerHTML = 
                `<tr><td colspan="7" class="empty-state">Error loading transactions: ${error.message}</td></tr>`;
        }
    }

    function renderTransactions(payments) {
        const tbody = document.getElementById('transactionsTableBody');
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
            document.getElementById('ratingsTableBody').innerHTML = 
                `<tr><td colspan="6" class="empty-state">Error loading ratings: ${error.message}</td></tr>`;
        }
    }

    function renderRatings() {
        const stats = ratingsData;
        if (!stats) return;

        // Update stats cards
        document.getElementById('ratingTotalRatings').textContent = stats.total_ratings || 0;
        document.getElementById('ratingOverallAvg').textContent = (stats.overall_average || 0).toFixed(1);
        document.getElementById('ratingMoviesWithRatings').textContent = stats.movies_with_ratings || 0;

        // Render rating distribution
        const distributionContainer = document.getElementById('ratingDistribution');
        const distribution = stats.rating_distribution || [];
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

        // Render ratings by movie
        const movieTableBody = document.getElementById('ratingsMovieTableBody');
        const movies = stats.ratings_by_movie || [];
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

        // Render top raters
        const topRatersContainer = document.getElementById('ratingTopRaters');
        const topRaters = stats.top_raters || [];
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
                document.getElementById('statTotalSeasons').textContent = stats.series_stats?.total_seasons || 0;
                document.getElementById('statTotalEpisodes').textContent = stats.series_stats?.total_episodes || 0;
                document.getElementById('statAvgPrice').textContent = `TSh ${Math.round(stats.price_distribution?.find(p => p.price_type === 'Paid')?.avg_price || 0).toLocaleString()}`;
                document.getElementById('statPaidMovies').textContent = stats.price_distribution?.find(p => p.price_type === 'Paid')?.count || 0;
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
                document.getElementById('statRepeatCustomers').textContent = stats.users_with_multiple_purchases || 0;
                document.getElementById('statAvgSpend').textContent = `TSh ${Math.round(stats.avg_spend_per_user || 0).toLocaleString()}`;
                
                const countryContainer = document.getElementById('usersCountryStats');
                if (stats.users_by_country && stats.users_by_country.length > 0) {
                    countryContainer.innerHTML = stats.users_by_country.map(c => 
                        `<span class="country-tag">${c.country} <span class="count">(${c.count})</span></span>`
                    ).join(' ');
                }
                
                const newestContainer = document.getElementById('usersNewestList');
                if (stats.newest_users && stats.newest_users.length > 0) {
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

    if (toggleStatsBtn) {
        toggleStatsBtn.addEventListener('click', function() {
            statsVisible = !statsVisible;
            moviesStatsContainer.style.display = statsVisible ? 'block' : 'none';
            statsToggleLabel.textContent = statsVisible ? 'Ficha Takwimu' : 'Onyesha Takwimu';
        });
    }

    const toggleUsersStatsBtn = document.getElementById('toggleUsersStatsBtn');
    const usersStatsToggleLabel = document.getElementById('usersStatsToggleLabel');
    const usersStatsContainer = document.getElementById('usersStatsContainer');

    if (toggleUsersStatsBtn) {
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
            alert(`📽️ Jina: ${movie.title}\nAina: ${movie.movie_type}\nNchi: ${movie.country}\nLugha: ${movie.language}\nKategoria: ${movie.category}\nMwaka: ${movie.year}\nBei: TSh ${movie.price || 0}\nRating: ${movie.avg_rating?.toFixed(1) || 0}/10 (${movie.total_ratings || 0} ratings)\nMaelezo: ${movie.description || '-'}`);
        }
    };

    window.viewMovieRatings = function(id) {
        const movie = moviesData.find(m => m.id === id);
        if (movie) {
            // Switch to ratings tab and filter
            document.querySelector('[data-tab="ratings"]').click();
            // Highlight the movie in the ratings list
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
        document.getElementById('confirmMessage').textContent = 'Je, una uhakika unataka kufuta movie hii? Kitendo hiki hakiwezi kutenduliwa.';
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
        document.getElementById('confirmMessage').textContent = 'Je, una uhakika unataka kufuta mtumiaji huyu? Kitendo hiki hakiwezi kutenduliwa.';
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

    // ===== Movie Modal =====
    function openMovieModal(movie = null) {
        const modal = document.getElementById('movieModal');
        const form = document.getElementById('movieForm');
        const title = document.getElementById('movieModalTitle');

        if (movie) {
            title.textContent = 'Hariri Movie';
            document.getElementById('movieId').value = movie.id;
            document.getElementById('movieTitle').value = movie.title;
            document.getElementById('movieType').value = movie.movie_type || '';
            document.getElementById('movieCountry').value = movie.country || '';
            document.getElementById('movieLang').value = movie.language || '';
            document.getElementById('movieCategory').value = movie.category || '';
            document.getElementById('movieYear').value = movie.year || '';
            document.getElementById('moviePrice').value = movie.price || '';
            document.getElementById('movieDescription').value = movie.description || '';
            document.getElementById('movieDuration').value = movie.movie_time || '';
        } else {
            title.textContent = 'Ongeza Movie';
            form.reset();
            document.getElementById('movieId').value = '';
        }

        openModal('movieModal');
    }

    document.getElementById('addMovieBtn').addEventListener('click', function() {
        openMovieModal(null);
    });

    document.getElementById('movieForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('movieId').value;
        
        const data = {
            title: document.getElementById('movieTitle').value.trim(),
            movie_type: document.getElementById('movieType').value,
            country: document.getElementById('movieCountry').value,
            language: document.getElementById('movieLang').value.trim(),
            category: document.getElementById('movieCategory').value,
            year: parseInt(document.getElementById('movieYear').value),
            price: parseFloat(document.getElementById('moviePrice').value) || 0,
            description: document.getElementById('movieDescription').value.trim(),
            movie_time: document.getElementById('movieDuration').value.trim() || 'N/A'
        };

        try {
            let response;
            if (id) {
                response = await api.adminUpdateMovie(id, data);
            } else {
                response = await api.adminCreateMovie(data);
            }
            
            if (response.success) {
                showToast(id ? 'Movie imesasishwa!' : 'Movie imeongezwa!');
                closeModal('movieModal');
                loadMovies();
            } else {
                alert(`❌ ${response.message || 'Operation failed'}`);
            }
        } catch (error) {
            console.error('Error saving movie:', error);
            alert(`❌ Error: ${error.message}`);
        }
    });

    // ===== User Modal =====
    function openUserModal(user = null) {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');

        if (user) {
            title.textContent = 'Hariri Mtumiaji';
            document.getElementById('userId').value = user.id;
            document.getElementById('userFullName').value = user.full_name;
            document.getElementById('userPhone').value = user.phone || '';
            document.getElementById('userCountry').value = user.country || '';
            document.getElementById('userRegion').value = user.region || '';
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPassword').value = '';
            document.getElementById('userPasswordConfirm').value = '';
            document.getElementById('userPassword').placeholder = 'Acha tupu ili kubaki sawa';
            document.getElementById('userPasswordConfirm').placeholder = 'Acha tupu ili kubaki sawa';
        } else {
            title.textContent = 'Ongeza Mtumiaji';
            form.reset();
            document.getElementById('userId').value = '';
            document.getElementById('userPassword').placeholder = 'Weka nenosiri';
            document.getElementById('userPasswordConfirm').placeholder = 'Rudia nenosiri';
        }

        openModal('userModal');
    }

    document.getElementById('addUserBtn').addEventListener('click', function() {
        openUserModal(null);
    });

    document.getElementById('userForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const password = document.getElementById('userPassword').value;
        const passwordConfirm = document.getElementById('userPasswordConfirm').value;

        if (!id && (!password || password !== passwordConfirm)) {
            alert('Nenosiri hazilingani!');
            return;
        }

        if (!id && password.length < 6) {
            alert('Nenosiri lazima iwe na herufi 6 au zaidi!');
            return;
        }

        const data = {
            full_name: document.getElementById('userFullName').value.trim(),
            phone: document.getElementById('userPhone').value.trim(),
            country: document.getElementById('userCountry').value,
            region: document.getElementById('userRegion').value,
            email: document.getElementById('userEmail').value.trim(),
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
            
            if (response.success) {
                showToast(id ? 'Mtumiaji amesasishwa!' : 'Mtumiaji ameongezwa!');
                closeModal('userModal');
                loadUsers();
            } else {
                alert(`❌ ${response.message || 'Operation failed'}`);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert(`❌ Error: ${error.message}`);
        }
    });

    // ===== Confirm Delete =====
    document.getElementById('confirmDeleteBtn').addEventListener('click', async function() {
        try {
            if (deleteType === 'movie') {
                const response = await api.adminDeleteMovie(deleteTarget);
                if (response.success) {
                    showToast('Movie imefutwa!');
                    loadMovies();
                } else {
                    alert(`❌ ${response.message || 'Delete failed'}`);
                }
            } else if (deleteType === 'user') {
                const response = await api.adminDeleteUser(deleteTarget);
                if (response.success) {
                    showToast('Mtumiaji amefutwa!');
                    loadUsers();
                } else {
                    alert(`❌ ${response.message || 'Delete failed'}`);
                }
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert(`❌ Error: ${error.message}`);
        }
        deleteTarget = null;
        deleteType = null;
        closeModal('confirmModal');
    });

    // ===== Modal Helpers =====
    function openModal(id) {
        document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
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
    loadMovies();
    loadUsers();
    loadTransactions();

    try {
        const user = auth.getUser();
        if (user && user.email) {
            document.getElementById('adminEmail').textContent = user.email;
        }
    } catch (e) {}

    console.log('🔐 Admin Panel Loaded');
});

// ===== Content Type Toggle =====
function setupContentTypeToggle() {
    const radios = document.querySelectorAll('input[name="contentType"]');
    const singleFields = document.getElementById('singleMovieFields');
    const seriesFields = document.getElementById('seriesFields');
    const labels = document.querySelectorAll('.content-type-selector label');

    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            labels.forEach(label => label.classList.remove('selected'));
            this.closest('label').classList.add('selected');

            if (this.value === 'single') {
                singleFields.style.display = 'block';
                seriesFields.classList.remove('visible');
            } else {
                singleFields.style.display = 'none';
                seriesFields.classList.add('visible');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('input[name="contentType"]')) {
        setupContentTypeToggle();
    }
});