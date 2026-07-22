// js/admin-activities.js - Activities Dashboard

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // ===== Check Admin Session =====
    if (!auth.checkAuth() || !auth.checkAdmin()) return;

    // ===== State =====
    let activities = [];
    let filteredActivities = [];
    let currentActivityPage = 1;
    let currentDetailPage = 1;
    const itemsPerPage = 50;
    let selectedUser = null;
    let currentProfileTab = 'basic';
    let charts = {};
    let usersData = [];
    let moviesData = [];

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

    // ===== Navigation =====
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            if (tab === 'movies') {
                window.location.href = 'admin.html';
            } else if (tab === 'users') {
                window.location.href = 'admin.html#users';
            } else if (tab === 'transactions') {
                window.location.href = 'admin.html#transactions';
            }
        });
    });

    // ===== Load Data from API =====
    async function loadData() {
        try {
            // Load dashboard overview
            const overview = await api.adminGetDashboardOverview();
            if (overview.success && overview.stats) {
                renderOverviewStats(overview.stats);
            }

            // Load recent activities
            const recent = await api.adminGetRecentActivities(100);
            if (recent.success && recent.activities) {
                activities = recent.activities;
                renderActivityFeed(1);
                renderActivityDetails(1);
            }

            // Load user engagement metrics
            const engagement = await api.adminGetUserEngagementMetrics();
            if (engagement.success && engagement.metrics) {
                renderUserEngagement(engagement.metrics);
            }

            // Load content performance
            const content = await api.adminGetContentPerformance(30);
            if (content.success && content.content_performance) {
                renderContentPerformance(content.content_performance);
            }

            // Load revenue analytics
            const revenue = await api.adminGetRevenueAnalytics(30);
            if (revenue.success && revenue.revenue_analytics) {
                renderRevenueAnalytics(revenue.revenue_analytics);
            }

            // Load drop-off analysis
            const dropoff = await api.adminGetUserDropOffAnalysis();
            if (dropoff.success && dropoff.drop_off_analysis) {
                renderDropoffAnalysis(dropoff.drop_off_analysis);
            }

            // Load activity statistics
            const stats = await api.adminGetActivityStatistics(7);
            if (stats.success && stats.statistics) {
                renderTopActiveUsers(stats.statistics);
            }

            // Load users for profile modal
            const usersRes = await api.adminGetUsers();
            if (usersRes.success && usersRes.users) {
                usersData = usersRes.users;
            }

            // Initialize charts
            initializeCharts();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('Error loading data: ' + error.message);
        }
    }

    // ===== Render Overview Stats =====
    function renderOverviewStats(stats) {
        document.getElementById('statTotalUsers').textContent = stats.total_users || 0;
        document.getElementById('statActiveUsers').textContent = stats.active_users || 0;
        document.getElementById('statNewUsers').textContent = stats.new_users || 0;
        document.getElementById('statActiveSubscriptions').textContent = stats.active_subscriptions || 0;
        document.getElementById('statRevenue').textContent = `TSh ${(stats.total_revenue || 0).toLocaleString()}`;
        document.getElementById('statAvgWatchTime').textContent = `${stats.avg_watch_time || 0}m`;
        document.getElementById('statCompletionRate').textContent = `${stats.completion_rate || 0}%`;
        document.getElementById('statTotalViews').textContent = stats.total_views || 0;
    }

    // ===== Render Activity Feed =====
    function renderActivityFeed(page = 1) {
        const feed = document.getElementById('activityFeed');
        const searchTerm = document.getElementById('activitySearch').value.toLowerCase();
        const typeFilter = document.getElementById('activityTypeFilter').value;

        let filtered = activities;
        
        if (searchTerm) {
            filtered = filtered.filter(a => 
                (a.user_name || '').toLowerCase().includes(searchTerm) || 
                (a.email || '').toLowerCase().includes(searchTerm)
            );
        }
        
        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.access_type === typeFilter);
        }

        const start = (page - 1) * 10;
        const end = start + 10;
        const paginated = filtered.slice(start, end);

        if (paginated.length === 0) {
            feed.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Hakuna shughuli zilizopatikana</p>
                </div>
            `;
        } else {
            feed.innerHTML = paginated.map(a => {
                const typeLabel = getActivityLabel(a.access_type);
                const icon = getActivityIcon(a.access_type);
                const statusLabel = a.completed ? 'Imekamilika' : 'Haijakamilika';
                const statusClass = a.completed ? 'completed' : 'incomplete';
                const userName = a.full_name || a.user_name || 'Unknown';
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon ${a.access_type || 'denied'}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">
                                <span class="user-name" onclick="window.viewUserProfile(${a.user_id})">${userName}</span>
                                <span>alitazama</span>
                                <span class="content-title">"${a.movie_title || 'Unknown'}"</span>
                                <span class="activity-type ${a.access_type || 'denied'}">${typeLabel}</span>
                                <span class="activity-status ${statusClass}">${statusLabel}</span>
                            </div>
                        </div>
                        <div class="activity-time">${formatTimeAgo(a.created_at)}</div>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('activityCount').textContent = `${filtered.length} shughuli`;
        
        const totalPages = Math.ceil(filtered.length / 10);
        document.getElementById('activityPageInfo').textContent = `Ukurasa ${page} wa ${totalPages || 1}`;
        document.querySelectorAll('#activityPagination .pagination-btn').forEach(btn => {
            if (btn.dataset.page === 'prev') {
                btn.disabled = page <= 1;
            } else if (btn.dataset.page === 'next') {
                btn.disabled = page >= totalPages;
            }
        });
        
        currentActivityPage = page;
    }

    // ===== Render Activity Details =====
    function renderActivityDetails(page = 1) {
        const tbody = document.getElementById('activityDetailsBody');
        const searchTerm = document.getElementById('detailSearch').value.toLowerCase();
        const typeFilter = document.getElementById('detailTypeFilter').value;

        let filtered = activities;
        
        if (searchTerm) {
            filtered = filtered.filter(a => 
                (a.full_name || '').toLowerCase().includes(searchTerm) || 
                (a.email || '').toLowerCase().includes(searchTerm)
            );
        }
        
        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.access_type === typeFilter);
        }

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginated = filtered.slice(start, end);

        if (paginated.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Hakuna shughuli zilizopatikana</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = paginated.map(a => {
                const avatarColor = getRandomColor(a.user_id);
                const userName = a.full_name || a.user_name || 'Unknown';
                const typeLabel = getActivityLabel(a.access_type);
                const statusLabel = a.completed ? 'Imekamilika' : 'Haijakamilika';
                const contentType = a.movie_type || 'single';
                
                return `
                    <tr onclick="window.viewUserProfile(${a.user_id})">
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar" style="background:${avatarColor};">${getUserInitials(userName)}</div>
                                <span>${userName}</span>
                            </div>
                        </td>
                        <td>${a.email || '-'}</td>
                        <td>${a.movie_title || '-'}</td>
                        <td><span class="content-type-badge ${contentType}">${contentType === 'series' ? 'Series' : 'Single'}</span></td>
                        <td><span class="access-type ${a.access_type || 'denied'}">${typeLabel}</span></td>
                        <td>${formatDuration(a.watched_duration || 0)}</td>
                        <td><span class="status-badge ${a.completed ? 'status-confirmed' : 'status-incomplete'}">${statusLabel}</span></td>
                        <td>${new Date(a.created_at).toLocaleString('sw')}</td>
                    </tr>
                `;
            }).join('');
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        document.getElementById('detailPageInfo').textContent = `Ukurasa ${page} wa ${totalPages || 1}`;
        document.querySelectorAll('#detailPagination .pagination-btn').forEach(btn => {
            if (btn.dataset.page === 'prev') {
                btn.disabled = page <= 1;
            } else if (btn.dataset.page === 'next') {
                btn.disabled = page >= totalPages;
            }
        });
        
        currentDetailPage = page;
    }

    // ===== Render User Engagement =====
    function renderUserEngagement(metrics) {
        // Conversion metrics
        const conversion = metrics.conversion || {};
        document.getElementById('metricFirstTimeWatchers').textContent = conversion.first_time_watchers || 0;
        document.getElementById('metricCompletedTrials').textContent = conversion.completed_free_trial || 0;
        document.getElementById('metricConvertedToSub').textContent = conversion.converted_to_subscription || 0;
        document.getElementById('metricConversionRate').textContent = `${conversion.trial_to_subscription_rate || 0}%`;

        // User segments
        const segments = metrics.user_segments || [];
        segments.forEach(segment => {
            const label = segment.segment || '';
            const count = segment.count || 0;
            if (label === 'Active Users') document.getElementById('segmentActive').textContent = count;
            else if (label === 'At-Risk Users') document.getElementById('segmentAtRisk').textContent = count;
            else if (label === 'High-Value Users') document.getElementById('segmentHighValue').textContent = count;
            else if (label === 'Never Watched') document.getElementById('segmentNeverWatched').textContent = count;
            else if (label === 'Trial Users Not Converted') document.getElementById('segmentTrialNotConverted').textContent = count;
        });

        // Click handlers for segments
        document.querySelectorAll('.segment-item').forEach(el => {
            el.addEventListener('click', function() {
                const segment = this.dataset.segment;
                const segmentMap = {
                    'active': 'Active Users',
                    'at-risk': 'At-Risk Users',
                    'high-value': 'High-Value Users',
                    'never-watched': 'Never Watched',
                    'trial-not-converted': 'Trial Users Not Converted'
                };
                const label = segmentMap[segment] || segment;
                const count = segments.find(s => s.segment === label)?.count || 0;
                alert(`Watumizi katika kundi "${label}": ${count}`);
            });
        });
    }

    // ===== Render Content Performance =====
    function renderContentPerformance(performance) {
        const sortBy = document.getElementById('contentSortFilter').value;
        
        // Most watched
        const mostWatched = performance.most_watched || [];
        const topContentList = document.getElementById('topContentList');
        
        if (mostWatched.length === 0) {
            topContentList.innerHTML = '<div class="empty-state">Hakuna data</div>';
        } else {
            const sorted = [...mostWatched];
            if (sortBy === 'views') sorted.sort((a, b) => b.total_views - a.total_views);
            else if (sortBy === 'completion') sorted.sort((a, b) => (b.completion_rate || 0) - (a.completion_rate || 0));
            else if (sortBy === 'unique') sorted.sort((a, b) => b.unique_viewers - a.unique_viewers);
            
            const maxViews = sorted[0]?.total_views || 1;
            
            topContentList.innerHTML = sorted.slice(0, 10).map((item, index) => {
                const barWidth = (item.total_views / maxViews) * 100;
                const completionRate = item.completion_rate || 0;
                return `
                    <div class="content-item">
                        <span class="content-rank">#${index + 1}</span>
                        <div class="content-info">
                            <div class="content-title">${item.title || 'Unknown'}</div>
                            <div class="content-meta">${item.category || ''} • ${item.country || ''} • ${item.movie_type || 'single'}</div>
                            <div class="content-bar">
                                <div class="content-bar-fill" style="width:${barWidth}%;"></div>
                            </div>
                        </div>
                        <div class="content-stats">
                            <div class="content-views">${(item.total_views || 0).toLocaleString()}</div>
                            <div class="content-completion">${Math.round(completionRate)}% ikamilika</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Series performance
        const seriesList = document.getElementById('seriesList');
        const seriesPerformance = performance.series_performance || [];
        
        if (seriesPerformance.length === 0) {
            seriesList.innerHTML = '<div class="empty-state">Hakuna series</div>';
        } else {
            seriesList.innerHTML = seriesPerformance.slice(0, 10).map(s => `
                <div class="series-item">
                    <div class="series-info">
                        <div class="series-name">${s.title || 'Unknown'}</div>
                        <div class="series-detail">${s.total_seasons || 0} seasons • ${s.total_episodes || 0} episodes</div>
                    </div>
                    <div class="series-views">${(s.total_views || 0).toLocaleString()} views</div>
                </div>
            `).join('');
        }

        // Drop-off analysis
        const dropoffList = document.getElementById('dropoffList');
        const dropoffItems = performance.drop_off_points || [];
        
        if (dropoffItems.length === 0) {
            dropoffList.innerHTML = '<div class="empty-state">Hakuna data ya kutosha</div>';
        } else {
            dropoffList.innerHTML = dropoffItems.slice(0, 10).map(item => {
                const rate = 100 - (item.watch_percentage || 0);
                const rateClass = rate > 70 ? 'high' : rate > 40 ? 'medium' : 'low';
                return `
                    <div class="dropoff-item">
                        <span class="dropoff-title">${item.title || 'Unknown'}</span>
                        <span class="dropoff-rate ${rateClass}">${Math.round(rate)}%</span>
                    </div>
                `;
            }).join('');
        }
    }

    // ===== Render Revenue Analytics =====
    function renderRevenueAnalytics(analytics) {
        const period = analytics.period || '30 days';
        
        document.getElementById('revTotalRevenue').textContent = `TSh ${(analytics.arpu?.total_revenue || 0).toLocaleString()}`;
        document.getElementById('revPayingUsers').textContent = analytics.arpu?.paying_users || 0;
        document.getElementById('revArpu').textContent = `TSh ${(analytics.arpu?.arpu || 0).toLocaleString()}`;
        document.getElementById('revTotalTransactions').textContent = analytics.revenue_breakdown?.reduce((sum, item) => sum + (item.transactions || 0), 0) || 0;
        document.getElementById('revFailedPayments').textContent = analytics.failed_payments?.length || 0;

        // Renewal rate
        const renewal = analytics.subscription_renewal || {};
        document.getElementById('renewalExpired').textContent = renewal.total_expired || 0;
        document.getElementById('renewalRenewed').textContent = renewal.renewed || 0;
        document.getElementById('renewalRate').textContent = `${renewal.renewal_rate || 0}%`;

        // Failed payments list
        const failedPaymentsList = document.getElementById('failedPaymentsList');
        const failedItems = analytics.failed_payments || [];
        
        if (failedItems.length === 0) {
            failedPaymentsList.innerHTML = '<div class="empty-state">Hakuna malipo yaliyoshindwa</div>';
        } else {
            failedPaymentsList.innerHTML = failedItems.slice(0, 10).map(p => `
                <div class="failed-payment-item">
                    <span>${new Date(p.date).toLocaleDateString('sw')}</span>
                    <span>${p.payment_method || 'Unknown'}</span>
                    <span>${p.failed_count || 0} failed</span>
                    <span>TSh ${(p.total_amount || 0).toLocaleString()}</span>
                </div>
            `).join('');
        }
    }

    // ===== Render Drop-Off Analysis =====
    function renderDropoffAnalysis(analysis) {
        // At-risk users
        const atRiskUsersList = document.getElementById('atRiskUsersList');
        const atRiskUsers = analysis.users_at_risk || [];
        
        if (atRiskUsers.length === 0) {
            atRiskUsersList.innerHTML = '<div class="empty-state">Hakuna watumizi walio hatarini</div>';
        } else {
            atRiskUsersList.innerHTML = atRiskUsers.slice(0, 10).map(u => {
                const totalStarts = u.total_starts || 0;
                const completions = u.completions || 0;
                const daysInactive = u.days_inactive || 0;
                return `
                    <div class="dropoff-user-item">
                        <span>${u.full_name || u.name || 'Unknown'}</span>
                        <span>${totalStarts} views, ${completions} completed</span>
                        <span>${daysInactive} days inactive</span>
                    </div>
                `;
            }).join('');
        }

        // Movies with high drop-off
        const highDropoffMovies = document.getElementById('highDropoffMovies');
        const dropoffMovies = analysis.movies_with_high_dropoff || [];
        
        if (dropoffMovies.length === 0) {
            highDropoffMovies.innerHTML = '<div class="empty-state">Hakuna data ya kutosha</div>';
        } else {
            highDropoffMovies.innerHTML = dropoffMovies.slice(0, 10).map(m => ({
                ...m,
                dropoffRate: m.drop_off_rate || 0
            })).sort((a, b) => b.dropoffRate - a.dropoffRate).map(m => `
                <div class="dropoff-movie-item">
                    <span>${m.title || 'Unknown'}</span>
                    <span>${m.total_views || 0} views</span>
                    <span class="dropoff-rate ${m.dropoffRate > 70 ? 'high' : m.dropoffRate > 40 ? 'medium' : 'low'}">${Math.round(m.dropoffRate)}%</span>
                </div>
            `).join('');
        }
    }

    // ===== Render Top Active Users =====
    function renderTopActiveUsers(stats) {
        const topUsersList = document.getElementById('topActiveUsersList');
        const topUsers = stats.top_active_users || [];
        
        if (topUsers.length === 0) {
            topUsersList.innerHTML = '<div class="empty-state">Hakuna watumizi</div>';
        } else {
            topUsersList.innerHTML = topUsers.map((u, index) => {
                const totalWatchTime = u.total_watch_time || 0;
                const hours = Math.floor(totalWatchTime / 60);
                const mins = totalWatchTime % 60;
                return `
                    <div class="top-user-item">
                        <span class="top-user-rank">#${index + 1}</span>
                        <div class="top-user-info">
                            <div class="top-user-name">${u.full_name || u.name || 'Unknown'}</div>
                            <div class="top-user-detail">${u.email || ''}</div>
                        </div>
                        <div class="top-user-stats">
                            <div class="top-user-activity">${u.activity_count || 0} shughuli</div>
                            <div style="font-size:0.7rem;color:var(--text-secondary);">${u.completions || 0} completed • ${hours}h ${mins}m</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // ===== Helper Functions =====
    function formatTimeAgo(dateString) {
        if (!dateString) return 'Sasa hivi';
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return date.toLocaleDateString('sw');
    }

    function formatDuration(minutes) {
        if (!minutes) return '0m';
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    function getActivityIcon(type) {
        const icons = {
            free_trial: 'fa-gift',
            subscription: 'fa-crown',
            purchase: 'fa-shopping-bag',
            paid_single: 'fa-shopping-bag',
            denied: 'fa-times-circle'
        };
        return icons[type] || 'fa-play';
    }

    function getActivityLabel(type) {
        const labels = {
            free_trial: 'Free Trial',
            subscription: 'Subscription',
            purchase: 'Single Purchase',
            paid_single: 'Single Purchase',
            denied: 'Denied'
        };
        return labels[type] || type;
    }

    function getUserInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function getRandomColor(seed) {
        const colors = ['#6c63ff', '#ff4eb0', '#22c55e', '#f97316', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6'];
        return colors[Math.abs(seed || 0) % colors.length];
    }

    // ===== User Profile Modal =====
    window.viewUserProfile = async function(userId) {
        try {
            const response = await api.adminGetUserDetails(userId);
            if (response.success && response.user) {
                const user = response.user;
                selectedUser = user;
                document.getElementById('profileModalTitle').textContent = `Profaili: ${user.full_name || 'User'}`;
                document.getElementById('userProfileModal').classList.add('active');
                renderProfileTab('basic');
            } else {
                alert('Error loading user details: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            alert('Error loading user details: ' + error.message);
        }
    };

    function renderProfileTab(tab) {
        if (!selectedUser) return;
        
        const user = selectedUser;
        
        // Update tab buttons
        document.querySelectorAll('.profile-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        // Hide all tab contents
        document.querySelectorAll('.profile-tab-content').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show selected tab
        const tabContent = document.getElementById(`profile${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        if (tabContent) {
            tabContent.style.display = 'block';
        }
        
        // Render content based on tab
        switch(tab) {
            case 'basic':
                renderProfileBasic(user);
                break;
            case 'watch-summary':
                renderProfileWatchSummary(user);
                break;
            case 'watch-history':
                renderProfileWatchHistory(user);
                break;
            case 'subscriptions':
                renderProfileSubscriptions(user);
                break;
            case 'purchases':
                renderProfilePurchases(user);
                break;
            case 'payments':
                renderProfilePayments(user);
                break;
            case 'access-attempts':
                renderProfileAccessAttempts(user);
                break;
        }
    }

    function renderProfileBasic(user) {
        const container = document.getElementById('profileBasic');
        const avatarColor = getRandomColor(user.id);
        const registered = new Date(user.created_at).toLocaleString('sw');
        const firstWatch = user.first_watch_at ? new Date(user.first_watch_at).toLocaleString('sw') : 'Bado hajatazama';
        
        container.innerHTML = `
            <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.5rem;">
                <div class="profile-avatar-large" style="background:${avatarColor}">
                    ${user.profile_image ? 
                        `<img src="${user.profile_image}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : 
                        getUserInitials(user.full_name)
                    }
                </div>
                <div>
                    <h3 style="font-size:1.3rem;">${user.full_name || 'Unknown'}</h3>
                    <p style="color:var(--text-secondary);">${user.email || 'No email'}</p>
                    <p style="color:var(--text-secondary);">${user.phone || 'N/A'}</p>
                </div>
            </div>
            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span class="profile-info-label">Nchi</span>
                    <span class="profile-info-value">${user.country || 'N/A'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Eneo</span>
                    <span class="profile-info-value">${user.region || 'N/A'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Tarehe ya Usajili</span>
                    <span class="profile-info-value">${registered}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Tarehe ya Kutazama Kwanza</span>
                    <span class="profile-info-value">${firstWatch}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Ameangalia</span>
                    <span class="profile-info-value">${user.has_watched_before ? 'Ndiyo' : 'Hapana'}</span>
                </div>
            </div>
        `;
    }

    function renderProfileWatchSummary(user) {
        const summary = user.watch_summary || {};
        const container = document.getElementById('profileWatchSummary');
        
        container.innerHTML = `
            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span class="profile-info-label">Jumla ya Kutazama</span>
                    <span class="profile-info-value">${summary.total_views || 0}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Zilizokamilika</span>
                    <span class="profile-info-value">${summary.completed_views || 0}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Jumla ya Muda</span>
                    <span class="profile-info-value">${summary.total_watch_time_minutes || 0}m</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Wastani wa Muda</span>
                    <span class="profile-info-value">${summary.avg_watch_time_minutes || 0}m</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Movie Pekee</span>
                    <span class="profile-info-value">${summary.unique_movies_watched || 0}</span>
                </div>
            </div>
        `;
    }

    function renderProfileWatchHistory(user) {
        const history = user.watch_history || [];
        const container = document.getElementById('profileWatchHistory');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna historia ya kutazama</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${history.slice(0, 50).map(a => `
                        <div class="watch-history-item">
                            <span>${a.movie_title || 'Unknown'}</span>
                            <span>${formatDuration(a.watched_duration || 0)}</span>
                            <span class="status-badge ${a.completed ? 'status-confirmed' : 'status-incomplete'}">${a.completed ? 'Imekamilika' : 'Haijakamilika'}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(a.created_at).toLocaleString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfileSubscriptions(user) {
        const subscriptions = user.subscriptions || [];
        const container = document.getElementById('profileSubscriptions');
        
        if (subscriptions.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna usajili</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${subscriptions.map(s => `
                        <div class="watch-history-item">
                            <span>${s.plan_name || 'Plan'}</span>
                            <span>TSh ${(s.price || 0).toLocaleString()}</span>
                            <span class="status-badge ${s.status === 'active' ? 'status-active' : 'status-inactive'}">${s.status === 'active' ? 'Inatumika' : 'Imekwisha'}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(s.created_at).toLocaleDateString('sw')} - ${new Date(s.expires_at).toLocaleDateString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfilePurchases(user) {
        const purchases = user.purchases || [];
        const container = document.getElementById('profilePurchases');
        
        if (purchases.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna manunuzi</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${purchases.map(p => `
                        <div class="watch-history-item">
                            <span>${p.movie_title || 'Movie'}</span>
                            <span>TSh ${(p.amount || 0).toLocaleString()}</span>
                            <span class="status-badge ${p.status === 'completed' ? 'status-confirmed' : 'status-incomplete'}">${p.status === 'completed' ? 'Imekamilika' : 'Inasubiri'}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(p.created_at).toLocaleString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfilePayments(user) {
        const payments = user.payments || [];
        const container = document.getElementById('profilePayments');
        
        if (payments.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna historia ya malipo</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${payments.map(p => `
                        <div class="watch-history-item">
                            <span>${p.payment_reference || 'N/A'}</span>
                            <span>TSh ${(p.amount || 0).toLocaleString()}</span>
                            <span>${p.payment_method || 'Unknown'}</span>
                            <span class="status-badge ${p.status === 'paid' ? 'status-confirmed' : 'status-incomplete'}">${p.status === 'paid' ? 'Imekamilika' : p.status}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(p.created_at).toLocaleString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfileAccessAttempts(user) {
        const attempts = user.access_attempts || {};
        const container = document.getElementById('profileAccessAttempts');
        
        container.innerHTML = `
            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span class="profile-info-label">Majaribio yaliyokataliwa</span>
                    <span class="profile-info-value">${attempts.total_denied || 0}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Movie pekee zilizokataliwa</span>
                    <span class="profile-info-value">${attempts.unique_movies_denied || 0}</span>
                </div>
            </div>
        `;
    }

    // ===== Profile Tab Handlers =====
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            renderProfileTab(tabName);
        });
    });

    // ===== Modal Close =====
    document.querySelectorAll('.modal-close').forEach(btn => {
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

    // ===== View User Details Button =====
    document.getElementById('viewUserDetailsBtn').addEventListener('click', function() {
        const selectedRow = document.querySelector('#activityDetailsBody tr:hover');
        if (selectedRow) {
            const onclick = selectedRow.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/viewUserProfile\((\d+)\)/);
                if (match) {
                    window.viewUserProfile(parseInt(match[1]));
                }
            }
        } else {
            alert('Tafadhali chagua mtumiaji kutoka kwenye orodha');
        }
    });

    // ===== Event Listeners =====
    document.getElementById('activitySearch').addEventListener('input', function() {
        renderActivityFeed(1);
    });

    document.getElementById('activityTypeFilter').addEventListener('change', function() {
        renderActivityFeed(1);
    });

    document.querySelectorAll('#activityPagination .pagination-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.page === 'prev') {
                renderActivityFeed(currentActivityPage - 1);
            } else if (this.dataset.page === 'next') {
                renderActivityFeed(currentActivityPage + 1);
            }
        });
    });

    document.getElementById('detailSearch').addEventListener('input', function() {
        renderActivityDetails(1);
    });

    document.getElementById('detailTypeFilter').addEventListener('change', function() {
        renderActivityDetails(1);
    });

    document.querySelectorAll('#detailPagination .pagination-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.page === 'prev') {
                renderActivityDetails(currentDetailPage - 1);
            } else if (this.dataset.page === 'next') {
                renderActivityDetails(currentDetailPage + 1);
            }
        });
    });

    document.getElementById('contentSortFilter').addEventListener('change', function() {
        // Re-render content performance with new sort
        loadData();
    });

    document.getElementById('refreshBtn').addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.classList.add('fa-spin');
        loadData().finally(() => {
            icon.classList.remove('fa-spin');
        });
    });

    // ===== Initialize Charts =====
    function initializeCharts() {
        // Destroy old charts if they exist
        Object.values(charts).forEach(chart => {
            if (chart) {
                try { chart.destroy(); } catch (e) {}
            }
        });
        charts = {};

        // Load data for charts from API
        Promise.all([
            api.adminGetUserEngagementMetrics(),
            api.adminGetContentPerformance(30),
            api.adminGetRevenueAnalytics(30),
            api.adminGetActivityStatistics(7)
        ]).then(([engagement, content, revenue, stats]) => {
            // Peak Hours Chart
            const peakHoursCtx = document.getElementById('peakHoursChart');
            if (peakHoursCtx && engagement.success && engagement.metrics.peak_watching_hours) {
                const hours = engagement.metrics.peak_watching_hours || [];
                charts.peakHours = new Chart(peakHoursCtx, {
                    type: 'bar',
                    data: {
                        labels: hours.map(h => `${h.hour || 0}:00`),
                        datasets: [{
                            label: 'Shughuli',
                            data: hours.map(h => h.views || 0),
                            backgroundColor: 'rgba(108, 99, 255, 0.6)',
                            borderColor: 'rgba(108, 99, 255, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7', maxTicksLimit: 12 } }
                        }
                    }
                });
            }

            // Activity Timeline Chart
            const timelineCtx = document.getElementById('activityTimelineChart');
            if (timelineCtx && engagement.success && engagement.metrics.activity_timeline) {
                const timeline = engagement.metrics.activity_timeline || [];
                const labels = timeline.map(d => new Date(d.date).toLocaleDateString('sw', { month: 'short', day: 'numeric' }));
                charts.timeline = new Chart(timelineCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Views',
                                data: timeline.map(d => d.total_views || 0),
                                borderColor: '#6c63ff',
                                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Unique Users',
                                data: timeline.map(d => d.unique_users || 0),
                                borderColor: '#22c55e',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                fill: true,
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: '#9aa2d7', boxWidth: 12, padding: 8 } }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7', maxTicksLimit: 15 } }
                        }
                    }
                });
            }

            // Category Performance Chart
            const categoryCtx = document.getElementById('categoryPerformanceChart');
            if (categoryCtx && content.success && content.content_performance.by_category) {
                const categories = content.content_performance.by_category || [];
                charts.category = new Chart(categoryCtx, {
                    type: 'bar',
                    data: {
                        labels: categories.map(c => c.category || 'Unknown'),
                        datasets: [{
                            label: 'Views',
                            data: categories.map(c => c.total_views || 0),
                            backgroundColor: ['rgba(108,99,255,0.6)', 'rgba(34,197,94,0.6)', 'rgba(249,115,22,0.6)', 'rgba(236,72,153,0.6)'],
                            borderColor: ['#6c63ff', '#22c55e', '#f97316', '#ec4899'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7' } }
                        }
                    }
                });
            }

            // Country Performance Chart
            const countryCtx = document.getElementById('countryPerformanceChart');
            if (countryCtx && content.success && content.content_performance.by_country) {
                const countries = content.content_performance.by_country || [];
                charts.country = new Chart(countryCtx, {
                    type: 'bar',
                    data: {
                        labels: countries.map(c => c.country || 'Unknown'),
                        datasets: [{
                            label: 'Views',
                            data: countries.map(c => c.total_views || 0),
                            backgroundColor: 'rgba(108,99,255,0.6)',
                            borderColor: '#6c63ff',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7' } }
                        }
                    }
                });
            }

            // Daily Revenue Chart
            const revenueCtx = document.getElementById('dailyRevenueChart');
            if (revenueCtx && revenue.success && revenue.revenue_analytics.daily_revenue) {
                const daily = revenue.revenue_analytics.daily_revenue || [];
                const labels = daily.map(d => new Date(d.date).toLocaleDateString('sw', { month: 'short', day: 'numeric' }));
                charts.revenue = new Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Revenue (TSh)',
                            data: daily.map(d => d.revenue || 0),
                            borderColor: '#22c55e',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: '#9aa2d7', boxWidth: 12 } }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7', maxTicksLimit: 15 } }
                        }
                    }
                });
            }

            // Revenue Breakdown Chart
            const breakdownCtx = document.getElementById('revenueBreakdownChart');
            if (breakdownCtx && revenue.success && revenue.revenue_analytics.revenue_breakdown) {
                const breakdown = revenue.revenue_analytics.revenue_breakdown || [];
                charts.breakdown = new Chart(breakdownCtx, {
                    type: 'pie',
                    data: {
                        labels: breakdown.map(b => b.type || 'Unknown'),
                        datasets: [{
                            data: breakdown.map(b => b.revenue || 0),
                            backgroundColor: ['rgba(108,99,255,0.8)', 'rgba(34,197,94,0.8)'],
                            borderColor: ['#6c63ff', '#22c55e'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#9aa2d7', boxWidth: 12, padding: 12 }
                            }
                        }
                    }
                });
            }

            // Monthly Trends Chart
            const monthlyCtx = document.getElementById('monthlyTrendsChart');
            if (monthlyCtx && revenue.success && revenue.revenue_analytics.monthly_trend) {
                const monthly = revenue.revenue_analytics.monthly_trend || [];
                charts.monthly = new Chart(monthlyCtx, {
                    type: 'bar',
                    data: {
                        labels: monthly.map(m => m.month || ''),
                        datasets: [{
                            label: 'Revenue (TSh)',
                            data: monthly.map(m => m.revenue || 0),
                            backgroundColor: 'rgba(108,99,255,0.6)',
                            borderColor: '#6c63ff',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: '#9aa2d7', boxWidth: 12 } }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7' } }
                        }
                    }
                });
            }

            // Daily Activity Chart
            const dailyCtx = document.getElementById('dailyActivityChart');
            if (dailyCtx && stats.success && stats.statistics.activity_by_day) {
                const daily = stats.statistics.activity_by_day || [];
                const labels = daily.map(d => new Date(d.date).toLocaleDateString('sw', { month: 'short', day: 'numeric' }));
                charts.daily = new Chart(dailyCtx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Activities',
                            data: daily.map(d => d.total_activities || 0),
                            backgroundColor: 'rgba(108,99,255,0.6)',
                            borderColor: '#6c63ff',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7', maxTicksLimit: 10 } }
                        }
                    }
                });
            }

            // Hourly Activity Chart
            const hourlyCtx = document.getElementById('hourlyActivityChart');
            if (hourlyCtx && stats.success && stats.statistics.activity_by_hour) {
                const hourly = stats.statistics.activity_by_hour || [];
                charts.hourly = new Chart(hourlyCtx, {
                    type: 'bar',
                    data: {
                        labels: hourly.map(h => `${h.hour || 0}:00`),
                        datasets: [{
                            label: 'Activities',
                            data: hourly.map(h => h.total_activities || 0),
                            backgroundColor: 'rgba(249,115,22,0.6)',
                            borderColor: '#f97316',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7', maxTicksLimit: 12 } }
                        }
                    }
                });
            }

            // Activity Type Chart
            const typeCtx = document.getElementById('activityTypeChart');
            if (typeCtx && stats.success && stats.statistics.activity_by_type) {
                const types = stats.statistics.activity_by_type || [];
                const typeLabels = types.map(t => t.access_type || 'unknown');
                charts.type = new Chart(typeCtx, {
                    type: 'pie',
                    data: {
                        labels: typeLabels.map(l => getActivityLabel(l)),
                        datasets: [{
                            data: types.map(t => t.total || 0),
                            backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)', 'rgba(108,99,255,0.8)', 'rgba(239,68,68,0.8)'],
                            borderColor: ['#3b82f6', '#22c55e', '#6c63ff', '#ef4444'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#9aa2d7', boxWidth: 12, padding: 12 }
                            }
                        }
                    }
                });
            }

            // Watch Time Distribution Chart
            const distributionCtx = document.getElementById('watchTimeDistributionChart');
            if (distributionCtx && stats.success && stats.statistics.activity_by_type) {
                const types = stats.statistics.activity_by_type || [];
                const distribution = {
                    '0-1m': 0,
                    '1-5m': 0,
                    '5-10m': 0,
                    '10-30m': 0,
                    '30-60m': 0,
                    '60+m': 0
                };
                
                types.forEach(t => {
                    const avg = t.avg_duration || 0;
                    if (avg <= 1) distribution['0-1m'] += t.total || 0;
                    else if (avg <= 5) distribution['1-5m'] += t.total || 0;
                    else if (avg <= 10) distribution['5-10m'] += t.total || 0;
                    else if (avg <= 30) distribution['10-30m'] += t.total || 0;
                    else if (avg <= 60) distribution['30-60m'] += t.total || 0;
                    else distribution['60+m'] += t.total || 0;
                });
                
                charts.distribution = new Chart(distributionCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(distribution),
                        datasets: [{
                            label: 'Users',
                            data: Object.values(distribution),
                            backgroundColor: 'rgba(236,72,153,0.6)',
                            borderColor: '#ec4899',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#9aa2d7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { ticks: { color: '#9aa2d7' } }
                        }
                    }
                });
            }
        }).catch(error => {
            console.warn('Error initializing charts:', error);
        });
    }

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

    // ===== Set Default Date Range =====
    function setDefaultDateRange() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        document.getElementById('dateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('dateTo').value = now.toISOString().split('T')[0];
    }

    // ===== Initialize =====
    setDefaultDateRange();
    loadData();

    // Set admin email
    try {
        const user = auth.getUser();
        if (user && user.email) {
            document.getElementById('adminEmail').textContent = user.email;
        }
    } catch (e) {}

    console.log('📊 Activities Dashboard Loaded');
});