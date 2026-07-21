// js/admin-activities.js
document.addEventListener('DOMContentLoaded', function() {
    // ===== Check Admin Session =====
    const adminSession = localStorage.getItem('tanzaflix_admin_session');
    if (!adminSession) {
        window.location.href = 'index.html';
        return;
    }

    // ===== State =====
    let activities = [];
    let filteredActivities = [];
    let currentActivityPage = 1;
    let currentDetailPage = 1;
    const itemsPerPage = 50;
    
    let selectedUser = null;
    let currentProfileTab = 'basic';
    
    let charts = {};

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
            localStorage.removeItem('tanzaflix_user');
            localStorage.removeItem('tanzaflix_admin_session');
            window.location.href = 'index.html';
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
            // Activities is current tab
        });
    });

    // ===== Generate Sample Data =====
    function generateSampleData() {
        const users = [
            { id: 1, name: 'John Doe', email: 'john@example.com', phone: '0712345678', country: 'Tanzania', region: 'Dar es Salaam', photo: 'https://ui-avatars.com/api/?name=John+Doe&background=6c63ff&color=fff&size=60', registered: '2024-12-01T10:00:00', firstWatch: '2024-12-02T14:30:00' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '0723456789', country: 'Kenya', region: 'Nairobi', photo: 'https://ui-avatars.com/api/?name=Jane+Smith&background=ff4eb0&color=fff&size=60', registered: '2024-12-05T08:15:00', firstWatch: '2024-12-06T19:20:00' },
            { id: 3, name: 'Ali Hassan', email: 'ali@example.com', phone: '0734567890', country: 'Tanzania', region: 'Zanzibar', photo: 'https://ui-avatars.com/api/?name=Ali+Hassan&background=22c55e&color=fff&size=60', registered: '2024-12-10T11:45:00', firstWatch: null },
            { id: 4, name: 'Sarah Mwangi', email: 'sarah@example.com', phone: '0745678901', country: 'Kenya', region: 'Mombasa', photo: 'https://ui-avatars.com/api/?name=Sarah+Mwangi&background=f97316&color=fff&size=60', registered: '2024-12-15T09:30:00', firstWatch: '2024-12-16T20:00:00' },
            { id: 5, name: 'David Ochieng', email: 'david@example.com', phone: '0756789012', country: 'Uganda', region: 'Kampala', photo: 'https://ui-avatars.com/api/?name=David+Ochieng&background=3b82f6&color=fff&size=60', registered: '2024-12-20T14:20:00', firstWatch: '2024-12-21T18:45:00' },
            { id: 6, name: 'Grace Mwakifwamba', email: 'grace@example.com', phone: '0767890123', country: 'Tanzania', region: 'Bara', photo: 'https://ui-avatars.com/api/?name=Grace+Mwakifwamba&background=8b5cf6&color=fff&size=60', registered: '2024-12-25T07:00:00', firstWatch: null },
            { id: 7, name: 'Peter Mwangi', email: 'peter@example.com', phone: '0778901234', country: 'Kenya', region: 'Nairobi', photo: 'https://ui-avatars.com/api/?name=Peter+Mwangi&background=ec4899&color=fff&size=60', registered: '2025-01-01T10:30:00', firstWatch: '2025-01-02T21:00:00' },
            { id: 8, name: 'Mary Kilonzo', email: 'mary@example.com', phone: '0789012345', country: 'Tanzania', region: 'Dar es Salaam', photo: 'https://ui-avatars.com/api/?name=Mary+Kilonzo&background=14b8a6&color=fff&size=60', registered: '2025-01-05T16:15:00', firstWatch: '2025-01-06T19:30:00' },
        ];

        const movies = [
            { id: 1, title: 'Safari ya Mtaa', type: 'single', category: 'Action', country: 'Bongo', duration: 130 },
            { id: 2, title: 'The Silent Shore', type: 'single', category: 'Drama', country: 'Kihindi', duration: 140 },
            { id: 3, title: 'Mapenzi ya Mwanga', type: 'single', category: 'Love story', country: 'Bongo', duration: 115 },
            { id: 4, title: 'Bollywood Dreams', type: 'single', category: 'Mix', country: 'Kihindi', duration: 155 },
            { id: 5, title: 'Mafia: The Untold Story', type: 'series', category: 'Action', country: 'Bongo', duration: 45 },
            { id: 6, title: 'MO is Calling', type: 'single', category: 'Action', country: 'Bongo', duration: 120 },
            { id: 7, title: 'Movie La Kutisha', type: 'single', category: 'Drama', country: 'Kihindi', duration: 135 },
            { id: 8, title: 'Action Hero', type: 'single', category: 'Action', country: 'Bongo', duration: 125 },
        ];

        const accessTypes = ['free_trial', 'subscription', 'purchase', 'denied'];
        const statuses = ['completed', 'incomplete'];
        const contentTypes = ['single', 'series'];

        activities = [];
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Generate 200+ activities
        for (let i = 0; i < 250; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const movie = movies[Math.floor(Math.random() * movies.length)];
            const accessType = accessTypes[Math.floor(Math.random() * accessTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
            
            // Random date in the last 30 days
            const date = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
            
            // Random watch duration
            const duration = Math.floor(Math.random() * 120) + 1;
            
            activities.push({
                id: i + 1,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                userPhoto: user.photo,
                movieId: movie.id,
                movieTitle: movie.title,
                contentType: contentType,
                accessType: accessType,
                watchDuration: duration,
                status: status,
                date: date.toISOString(),
                country: user.country,
                region: user.region
            });
        }

        // Sort by date descending
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Add some watch histories for users
        const watchHistory = {};
        activities.forEach(a => {
            if (!watchHistory[a.userId]) {
                watchHistory[a.userId] = [];
            }
            watchHistory[a.userId].push({
                movieTitle: a.movieTitle,
                duration: a.watchDuration,
                status: a.status,
                date: a.date
            });
        });

        // Add payment history
        const paymentHistory = {};
        const paymentMethods = ['M-Pesa', 'Airtel Money', 'Bank Card', 'Mix by Yas'];
        users.forEach((user, idx) => {
            const numPayments = Math.floor(Math.random() * 5) + 1;
            paymentHistory[user.id] = [];
            for (let i = 0; i < numPayments; i++) {
                const amount = Math.floor(Math.random() * 50000) + 5000;
                const date = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
                paymentHistory[user.id].push({
                    ref: 'TXN-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
                    amount: amount,
                    method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                    status: Math.random() > 0.1 ? 'completed' : 'failed',
                    date: date.toISOString()
                });
            }
        });

        // Add subscriptions
        const subscriptions = {};
        users.forEach((user, idx) => {
            const numSubs = Math.floor(Math.random() * 3);
            subscriptions[user.id] = [];
            for (let i = 0; i < numSubs; i++) {
                const startDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 1);
                subscriptions[user.id].push({
                    plan: Math.random() > 0.5 ? 'Premium' : 'Basic',
                    price: Math.random() > 0.5 ? 25000 : 15000,
                    status: Math.random() > 0.3 ? 'active' : 'expired',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });
            }
        });

        // Add access attempts
        const accessAttempts = {};
        users.forEach((user, idx) => {
            const numAttempts = Math.floor(Math.random() * 3);
            accessAttempts[user.id] = [];
            for (let i = 0; i < numAttempts; i++) {
                const movie = movies[Math.floor(Math.random() * movies.length)];
                const date = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
                accessAttempts[user.id].push({
                    movieTitle: movie.title,
                    reason: 'Insufficient permissions',
                    date: date.toISOString()
                });
            }
        });

        // Store generated data
        window._sampleData = {
            users,
            movies,
            watchHistory,
            paymentHistory,
            subscriptions,
            accessAttempts
        };

        return { users, movies };
    }

    // ===== Initialize Data =====
    const { users, movies } = generateSampleData();
    const sampleData = window._sampleData;

    // ===== Helper Functions =====
    function formatTimeAgo(dateString) {
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
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    function formatCurrency(amount) {
        return `TSh ${amount.toLocaleString()}`;
    }

    function getRandomColor(seed) {
        const colors = ['#6c63ff', '#ff4eb0', '#22c55e', '#f97316', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6'];
        return colors[seed % colors.length];
    }

    function getUserInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function getActivityIcon(type) {
        const icons = {
            free_trial: 'fa-gift',
            subscription: 'fa-crown',
            purchase: 'fa-shopping-bag',
            denied: 'fa-times-circle'
        };
        return icons[type] || 'fa-play';
    }

    function getActivityLabel(type) {
        const labels = {
            free_trial: 'Free Trial',
            subscription: 'Subscription',
            purchase: 'Single Purchase',
            denied: 'Denied'
        };
        return labels[type] || type;
    }

    function getStatusLabel(status) {
        return status === 'completed' ? 'Imekamilika' : 'Haijakamilika';
    }

    // ===== Render Overview Stats =====
    function renderOverviewStats() {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Calculate stats
        const totalUsers = users.length;
        const activeUsers = users.filter(u => {
            const userActivities = activities.filter(a => a.userId === u.id);
            const recentActivity = userActivities.some(a => new Date(a.date) >= sevenDaysAgo);
            return recentActivity;
        }).length;
        const newUsers = users.filter(u => new Date(u.registered) >= thirtyDaysAgo).length;
        
        const activeSubscriptions = Object.values(sampleData.subscriptions)
            .flat()
            .filter(s => s.status === 'active').length;

        const totalRevenue = activities
            .filter(a => a.accessType === 'subscription' || a.accessType === 'purchase')
            .reduce((sum, a) => {
                const price = a.accessType === 'subscription' ? 25000 : 15000;
                return sum + price;
            }, 0);

        const avgWatchTime = activities.reduce((sum, a) => sum + a.watchDuration, 0) / (activities.length || 1);
        
        const completedViews = activities.filter(a => a.status === 'completed').length;
        const completionRate = activities.length > 0 ? (completedViews / activities.length) * 100 : 0;
        
        const totalViews = activities.filter(a => new Date(a.date) >= sevenDaysAgo).length;

        // Update DOM
        document.getElementById('statTotalUsers').textContent = totalUsers;
        document.getElementById('statTotalUsersChange').textContent = '▲ +12%';
        
        document.getElementById('statActiveUsers').textContent = activeUsers;
        document.getElementById('statActiveUsersChange').textContent = activeUsers > 10 ? '▲ +5%' : '▼ -3%';
        
        document.getElementById('statNewUsers').textContent = newUsers;
        document.getElementById('statNewUsersChange').textContent = newUsers > 5 ? '▲ +8%' : '◆ 0%';
        
        document.getElementById('statActiveSubscriptions').textContent = activeSubscriptions;
        document.getElementById('statActiveSubscriptionsChange').textContent = activeSubscriptions > 3 ? '▲ +10%' : '▼ -2%';
        
        document.getElementById('statRevenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('statRevenueChange').textContent = totalRevenue > 50000 ? '▲ +15%' : '▼ -5%';
        
        document.getElementById('statAvgWatchTime').textContent = formatDuration(Math.round(avgWatchTime));
        document.getElementById('statAvgWatchTimeChange').textContent = '◆ 0%';
        
        document.getElementById('statCompletionRate').textContent = `${Math.round(completionRate)}%`;
        document.getElementById('statCompletionRateChange').textContent = completionRate > 50 ? '▲ +6%' : '▼ -4%';
        
        document.getElementById('statTotalViews').textContent = totalViews;
        document.getElementById('statTotalViewsChange').textContent = totalViews > 100 ? '▲ +20%' : '▼ -8%';
    }

    // ===== Render Activity Feed =====
    function renderActivityFeed(page = 1) {
        const feed = document.getElementById('activityFeed');
        const searchTerm = document.getElementById('activitySearch').value.toLowerCase();
        const typeFilter = document.getElementById('activityTypeFilter').value;

        let filtered = activities;
        
        if (searchTerm) {
            filtered = filtered.filter(a => 
                a.userName.toLowerCase().includes(searchTerm) || 
                a.userEmail.toLowerCase().includes(searchTerm)
            );
        }
        
        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.accessType === typeFilter);
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
            feed.innerHTML = paginated.map(a => `
                <div class="activity-item">
                    <div class="activity-icon ${a.accessType}">
                        <i class="fas ${getActivityIcon(a.accessType)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <span class="user-name" onclick="viewUserProfile(${a.userId})">${a.userName}</span>
                            <span>alitazama</span>
                            <span class="content-title">"${a.movieTitle}"</span>
                            <span class="activity-type ${a.accessType}">${getActivityLabel(a.accessType)}</span>
                            <span class="activity-status ${a.status}">${getStatusLabel(a.status)}</span>
                        </div>
                    </div>
                    <div class="activity-time">${formatTimeAgo(a.date)}</div>
                </div>
            `).join('');
        }

        document.getElementById('activityCount').textContent = `${filtered.length} shughuli`;
        
        // Update pagination
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
                a.userName.toLowerCase().includes(searchTerm) || 
                a.userEmail.toLowerCase().includes(searchTerm)
            );
        }
        
        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.accessType === typeFilter);
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
                const avatarColor = getRandomColor(a.userId);
                return `
                    <tr onclick="viewUserProfile(${a.userId})">
                        <td>
                            <div class="user-cell">
                                ${a.userPhoto ? 
                                    `<img src="${a.userPhoto}" alt="${a.userName}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />` :
                                    `<div class="user-avatar" style="background:${avatarColor};">${getUserInitials(a.userName)}</div>`
                                }
                                <span>${a.userName}</span>
                            </div>
                        </td>
                        <td>${a.userEmail}</td>
                        <td>${a.movieTitle}</td>
                        <td><span class="content-type-badge ${a.contentType}">${a.contentType === 'series' ? 'Series' : 'Single'}</span></td>
                        <td><span class="access-type ${a.accessType}">${getActivityLabel(a.accessType)}</span></td>
                        <td>${formatDuration(a.watchDuration)}</td>
                        <td><span class="status-badge status-${a.status}">${getStatusLabel(a.status)}</span></td>
                        <td>${new Date(a.date).toLocaleString('sw')}</td>
                    </tr>
                `;
            }).join('');
        }

        // Update pagination
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
    function renderUserEngagement() {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // Conversion metrics
        const firstTimeWatchers = users.filter(u => u.firstWatch !== null).length;
        const completedTrials = activities.filter(a => a.accessType === 'free_trial' && a.status === 'completed').length;
        const convertedToSub = Object.values(sampleData.subscriptions)
            .flat()
            .filter(s => s.status === 'active').length;
        const conversionRate = completedTrials > 0 ? (convertedToSub / completedTrials) * 100 : 0;

        document.getElementById('metricFirstTimeWatchers').textContent = firstTimeWatchers;
        document.getElementById('metricCompletedTrials').textContent = completedTrials;
        document.getElementById('metricConvertedToSub').textContent = convertedToSub;
        document.getElementById('metricConversionRate').textContent = `${Math.round(conversionRate)}%`;

        // User segments
        const activeUsers = users.filter(u => {
            const userActivities = activities.filter(a => a.userId === u.id);
            return userActivities.some(a => new Date(a.date) >= sevenDaysAgo);
        }).length;

        const atRiskUsers = users.filter(u => {
            const userActivities = activities.filter(a => a.userId === u.id);
            const hasOldActivity = userActivities.some(a => new Date(a.date) >= fourteenDaysAgo && new Date(a.date) < sevenDaysAgo);
            return hasOldActivity;
        }).length;

        const highValueUsers = Object.keys(sampleData.subscriptions)
            .filter(key => sampleData.subscriptions[key].some(s => s.status === 'active'))
            .length;

        const neverWatched = users.filter(u => !u.firstWatch).length;

        const trialNotConverted = users.filter(u => {
            const userActivities = activities.filter(a => a.userId === u.id && a.accessType === 'free_trial');
            return userActivities.length > 0 && !sampleData.subscriptions[u.id]?.some(s => s.status === 'active');
        }).length;

        document.getElementById('segmentActive').textContent = activeUsers;
        document.getElementById('segmentAtRisk').textContent = atRiskUsers;
        document.getElementById('segmentHighValue').textContent = highValueUsers;
        document.getElementById('segmentNeverWatched').textContent = neverWatched;
        document.getElementById('segmentTrialNotConverted').textContent = trialNotConverted;

        // Click handlers for segments
        document.querySelectorAll('.segment-item').forEach(el => {
            el.addEventListener('click', function() {
                const segment = this.dataset.segment;
                let filteredUsers = [];
                switch(segment) {
                    case 'active':
                        filteredUsers = users.filter(u => {
                            const userActivities = activities.filter(a => a.userId === u.id);
                            return userActivities.some(a => new Date(a.date) >= sevenDaysAgo);
                        });
                        break;
                    case 'at-risk':
                        filteredUsers = users.filter(u => {
                            const userActivities = activities.filter(a => a.userId === u.id);
                            return userActivities.some(a => new Date(a.date) >= fourteenDaysAgo && new Date(a.date) < sevenDaysAgo);
                        });
                        break;
                    case 'high-value':
                        filteredUsers = users.filter(u => 
                            sampleData.subscriptions[u.id]?.some(s => s.status === 'active')
                        );
                        break;
                    case 'never-watched':
                        filteredUsers = users.filter(u => !u.firstWatch);
                        break;
                    case 'trial-not-converted':
                        filteredUsers = users.filter(u => {
                            const userActivities = activities.filter(a => a.userId === u.id && a.accessType === 'free_trial');
                            return userActivities.length > 0 && !sampleData.subscriptions[u.id]?.some(s => s.status === 'active');
                        });
                        break;
                }
                if (filteredUsers.length > 0) {
                    const names = filteredUsers.map(u => u.name).join(', ');
                    alert(`Watumizi ${filteredUsers.length}:\n${names}`);
                } else {
                    alert('Hakuna watumizi katika kundi hili');
                }
            });
        });
    }

    // ===== Render Content Performance =====
    function renderContentPerformance() {
        const sortBy = document.getElementById('contentSortFilter').value;
        
        // Aggregate movie views
        const movieStats = {};
        activities.forEach(a => {
            if (!movieStats[a.movieId]) {
                const movie = movies.find(m => m.id === a.movieId);
                movieStats[a.movieId] = {
                    id: a.movieId,
                    title: a.movieTitle,
                    type: a.contentType,
                    category: movie ? movie.category : 'Unknown',
                    country: movie ? movie.country : 'Unknown',
                    views: 0,
                    uniqueViewers: new Set(),
                    completions: 0,
                    totalDuration: 0
                };
            }
            movieStats[a.movieId].views++;
            movieStats[a.movieId].uniqueViewers.add(a.userId);
            if (a.status === 'completed') {
                movieStats[a.movieId].completions++;
            }
            movieStats[a.movieId].totalDuration += a.watchDuration;
        });

        let sortedMovies = Object.values(movieStats);
        if (sortBy === 'views') {
            sortedMovies.sort((a, b) => b.views - a.views);
        } else if (sortBy === 'completion') {
            sortedMovies.sort((a, b) => (b.completions / b.views) - (a.completions / a.views));
        } else if (sortBy === 'unique') {
            sortedMovies.sort((a, b) => b.uniqueViewers.size - a.uniqueViewers.size);
        }

        // Render top content
        const topContentList = document.getElementById('topContentList');
        const topItems = sortedMovies.slice(0, 10);
        
        if (topItems.length === 0) {
            topContentList.innerHTML = '<div class="empty-state">Hakuna data</div>';
        } else {
            topContentList.innerHTML = topItems.map((item, index) => {
                const maxViews = topItems[0]?.views || 1;
                const barWidth = (item.views / maxViews) * 100;
                const completionRate = item.views > 0 ? Math.round((item.completions / item.views) * 100) : 0;
                return `
                    <div class="content-item">
                        <span class="content-rank">#${index + 1}</span>
                        <div class="content-info">
                            <div class="content-title">${item.title}</div>
                            <div class="content-meta">${item.category} • ${item.country} • ${item.type === 'series' ? 'Series' : 'Single'}</div>
                            <div class="content-bar">
                                <div class="content-bar-fill" style="width:${barWidth}%;"></div>
                            </div>
                        </div>
                        <div class="content-stats">
                            <div class="content-views">${item.views.toLocaleString()}</div>
                            <div class="content-completion">${completionRate}% ikamilika</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render series performance
        const seriesList = document.getElementById('seriesList');
        const seriesItems = Object.values(movieStats).filter(m => m.type === 'series');
        
        if (seriesItems.length === 0) {
            seriesList.innerHTML = '<div class="empty-state">Hakuna series</div>';
        } else {
            const totalEpisodes = seriesItems.reduce((sum, s) => sum + Math.floor(s.views / 3), 0);
            seriesList.innerHTML = seriesItems.map(s => {
                const episodes = Math.floor(s.views / 2) + 1;
                return `
                    <div class="series-item">
                        <div class="series-info">
                            <div class="series-name">${s.title}</div>
                            <div class="series-detail">${Math.ceil(s.views / 5)} seasons • ${episodes} episodes</div>
                        </div>
                        <div class="series-views">${s.views} views</div>
                    </div>
                `;
            }).join('');
        }

        // Render drop-off analysis
        const dropoffList = document.getElementById('dropoffList');
        const dropoffItems = Object.values(movieStats)
            .filter(m => m.views >= 10)
            .map(m => ({
                ...m,
                dropoffRate: m.views > 0 ? ((m.views - m.completions) / m.views) * 100 : 0
            }))
            .sort((a, b) => b.dropoffRate - a.dropoffRate)
            .slice(0, 10);

        if (dropoffItems.length === 0) {
            dropoffList.innerHTML = '<div class="empty-state">Hakuna data ya kutosha</div>';
        } else {
            dropoffList.innerHTML = dropoffItems.map(item => {
                const rateClass = item.dropoffRate > 70 ? 'high' : item.dropoffRate > 40 ? 'medium' : 'low';
                return `
                    <div class="dropoff-item">
                        <span class="dropoff-title">${item.title}</span>
                        <span class="dropoff-rate ${rateClass}">${Math.round(item.dropoffRate)}%</span>
                    </div>
                `;
            }).join('');
        }
    }

    // ===== Render Revenue Analytics =====
    function renderRevenueAnalytics() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Filter activities in last 30 days
        const recentActivities = activities.filter(a => new Date(a.date) >= thirtyDaysAgo);
        
        // Calculate metrics
        const totalRevenue = recentActivities
            .filter(a => a.accessType === 'subscription' || a.accessType === 'purchase')
            .reduce((sum, a) => {
                const price = a.accessType === 'subscription' ? 25000 : 15000;
                return sum + price;
            }, 0);

        const payingUsers = new Set(
            recentActivities
                .filter(a => a.accessType === 'subscription' || a.accessType === 'purchase')
                .map(a => a.userId)
        ).size;

        const totalTransactions = recentActivities
            .filter(a => a.accessType === 'subscription' || a.accessType === 'purchase')
            .length;

        const failedPayments = recentActivities
            .filter(a => a.accessType === 'denied')
            .length;

        const arpu = payingUsers > 0 ? totalRevenue / payingUsers : 0;

        document.getElementById('revTotalRevenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('revPayingUsers').textContent = payingUsers;
        document.getElementById('revArpu').textContent = formatCurrency(arpu);
        document.getElementById('revTotalTransactions').textContent = totalTransactions;
        document.getElementById('revFailedPayments').textContent = failedPayments;

        // Subscription renewal
        const allSubscriptions = Object.values(sampleData.subscriptions).flat();
        const expiredSubscriptions = allSubscriptions.filter(s => s.status === 'expired').length;
        const renewedSubscriptions = allSubscriptions.filter(s => s.status === 'active').length;
        const renewalRate = expiredSubscriptions + renewedSubscriptions > 0 
            ? (renewedSubscriptions / (expiredSubscriptions + renewedSubscriptions)) * 100 
            : 0;

        document.getElementById('renewalExpired').textContent = expiredSubscriptions;
        document.getElementById('renewalRenewed').textContent = renewedSubscriptions;
        document.getElementById('renewalRate').textContent = `${Math.round(renewalRate)}%`;

        // Failed payments list
        const failedPaymentsList = document.getElementById('failedPaymentsList');
        const failedItems = recentActivities
            .filter(a => a.accessType === 'denied')
            .slice(0, 10);

        if (failedItems.length === 0) {
            failedPaymentsList.innerHTML = '<div class="empty-state">Hakuna malipo yaliyoshindwa</div>';
        } else {
            failedPaymentsList.innerHTML = failedItems.map(a => `
                <div class="failed-payment-item">
                    <span>${new Date(a.date).toLocaleDateString('sw')}</span>
                    <span>${a.userName}</span>
                    <span>${a.movieTitle}</span>
                    <span>${formatCurrency(15000)}</span>
                    <span class="status-badge status-incomplete">Imeshindwa</span>
                </div>
            `).join('');
        }
    }

    // ===== Render Drop-Off Analysis =====
    function renderDropoffAnalysis() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // At-risk users
        const atRiskUsersList = document.getElementById('atRiskUsersList');
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const atRiskUsers = users.filter(u => {
            const userActivities = activities.filter(a => a.userId === u.id);
            const hasActivity = userActivities.some(a => new Date(a.date) >= fourteenDaysAgo && new Date(a.date) < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
            return hasActivity;
        }).slice(0, 10);

        if (atRiskUsers.length === 0) {
            atRiskUsersList.innerHTML = '<div class="empty-state">Hakuna watumizi walio hatarini</div>';
        } else {
            atRiskUsersList.innerHTML = atRiskUsers.map(u => {
                const userActivities = activities.filter(a => a.userId === u.id);
                const lastActivity = userActivities.length > 0 ? new Date(Math.max(...userActivities.map(a => new Date(a.date).getTime()))) : null;
                const daysInactive = lastActivity ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24)) : 'N/A';
                const totalViews = userActivities.length;
                const completions = userActivities.filter(a => a.status === 'completed').length;
                return `
                    <div class="dropoff-user-item">
                        <span>${u.name}</span>
                        <span>${totalViews} views, ${completions} completed</span>
                        <span>${daysInactive} days inactive</span>
                    </div>
                `;
            }).join('');
        }

        // Movies with high drop-off
        const highDropoffMovies = document.getElementById('highDropoffMovies');
        const movieStats = {};
        activities.forEach(a => {
            if (!movieStats[a.movieId]) {
                movieStats[a.movieId] = {
                    title: a.movieTitle,
                    views: 0,
                    completions: 0
                };
            }
            movieStats[a.movieId].views++;
            if (a.status === 'completed') {
                movieStats[a.movieId].completions++;
            }
        });

        const highDropoff = Object.values(movieStats)
            .filter(m => m.views >= 10)
            .map(m => ({
                ...m,
                dropoffRate: m.views > 0 ? ((m.views - m.completions) / m.views) * 100 : 0
            }))
            .sort((a, b) => b.dropoffRate - a.dropoffRate)
            .slice(0, 10);

        if (highDropoff.length === 0) {
            highDropoffMovies.innerHTML = '<div class="empty-state">Hakuna data ya kutosha</div>';
        } else {
            highDropoffMovies.innerHTML = highDropoff.map(m => `
                <div class="dropoff-movie-item">
                    <span>${m.title}</span>
                    <span>${m.views} views</span>
                    <span class="dropoff-rate ${m.dropoffRate > 70 ? 'high' : m.dropoffRate > 40 ? 'medium' : 'low'}">${Math.round(m.dropoffRate)}%</span>
                </div>
            `).join('');
        }
    }

    // ===== Render Top Active Users =====
    function renderTopActiveUsers() {
        const topUsersList = document.getElementById('topActiveUsersList');
        
        const userActivityCount = {};
        activities.forEach(a => {
            if (!userActivityCount[a.userId]) {
                const user = users.find(u => u.id === a.userId);
                userActivityCount[a.userId] = {
                    id: a.userId,
                    name: a.userName,
                    email: a.userEmail,
                    activities: 0,
                    completions: 0,
                    totalWatchTime: 0
                };
            }
            userActivityCount[a.userId].activities++;
            if (a.status === 'completed') {
                userActivityCount[a.userId].completions++;
            }
            userActivityCount[a.userId].totalWatchTime += a.watchDuration;
        });

        const sortedUsers = Object.values(userActivityCount)
            .sort((a, b) => b.activities - a.activities)
            .slice(0, 10);

        if (sortedUsers.length === 0) {
            topUsersList.innerHTML = '<div class="empty-state">Hakuna watumizi</div>';
        } else {
            topUsersList.innerHTML = sortedUsers.map((u, index) => `
                <div class="top-user-item">
                    <span class="top-user-rank">#${index + 1}</span>
                    <div class="top-user-info">
                        <div class="top-user-name">${u.name}</div>
                        <div class="top-user-detail">${u.email}</div>
                    </div>
                    <div class="top-user-stats">
                        <div class="top-user-activity">${u.activities} shughuli</div>
                        <div style="font-size:0.7rem;color:var(--text-secondary);">${u.completions} completed</div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ===== Initialize Charts =====
    function initializeCharts() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Prepare data
        const days = [];
        const viewsByDay = [];
        const usersByDay = [];
        const trialsByDay = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            days.push(dateStr);
            
            const dayActivities = activities.filter(a => new Date(a.date).toDateString() === dateStr);
            viewsByDay.push(dayActivities.length);
            
            const uniqueUsers = new Set(dayActivities.map(a => a.userId));
            usersByDay.push(uniqueUsers.size);
            
            const trials = dayActivities.filter(a => a.accessType === 'free_trial');
            trialsByDay.push(trials.length);
        }

        // Peak Hours Chart
        const hourLabels = Array.from({length: 24}, (_, i) => `${i}:00`);
        const hourData = Array(24).fill(0);
        activities.forEach(a => {
            const hour = new Date(a.date).getHours();
            hourData[hour]++;
        });

        const ctxPeak = document.getElementById('peakHoursChart').getContext('2d');
        charts.peakHours = new Chart(ctxPeak, {
            type: 'bar',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: 'Shughuli',
                    data: hourData,
                    backgroundColor: 'rgba(108, 99, 255, 0.6)',
                    borderColor: 'rgba(108, 99, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7', maxTicksLimit: 12 }
                    }
                }
            }
        });

        // Activity Timeline Chart
        const ctxTimeline = document.getElementById('activityTimelineChart').getContext('2d');
        charts.timeline = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Views',
                        data: viewsByDay,
                        borderColor: '#6c63ff',
                        backgroundColor: 'rgba(108, 99, 255, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Unique Users',
                        data: usersByDay,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Free Trials',
                        data: trialsByDay,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9aa2d7', boxWidth: 12, padding: 8 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7', maxTicksLimit: 15 }
                    }
                }
            }
        });

        // Category Performance Chart
        const categories = ['Action', 'Drama', 'Love story', 'Mix'];
        const categoryViews = categories.map(cat => {
            const catMovies = movies.filter(m => m.category === cat);
            let views = 0;
            catMovies.forEach(m => {
                views += activities.filter(a => a.movieId === m.id).length;
            });
            return views;
        });

        const ctxCategory = document.getElementById('categoryPerformanceChart').getContext('2d');
        charts.category = new Chart(ctxCategory, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Views',
                    data: categoryViews,
                    backgroundColor: ['rgba(108,99,255,0.6)', 'rgba(34,197,94,0.6)', 'rgba(249,115,22,0.6)', 'rgba(236,72,153,0.6)'],
                    borderColor: ['#6c63ff', '#22c55e', '#f97316', '#ec4899'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7' }
                    }
                }
            }
        });

        // Country Performance Chart
        const countries = [...new Set(movies.map(m => m.country))];
        const countryViews = countries.map(country => {
            const countryMovies = movies.filter(m => m.country === country);
            let views = 0;
            countryMovies.forEach(m => {
                views += activities.filter(a => a.movieId === m.id).length;
            });
            return views;
        });

        const ctxCountry = document.getElementById('countryPerformanceChart').getContext('2d');
        charts.country = new Chart(ctxCountry, {
            type: 'bar',
            data: {
                labels: countries,
                datasets: [{
                    label: 'Views',
                    data: countryViews,
                    backgroundColor: 'rgba(108,99,255,0.6)',
                    borderColor: '#6c63ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7' }
                    }
                }
            }
        });

        // Daily Revenue Chart
        const revenueByDay = days.map((day, index) => {
            const dayActivities = activities.filter(a => new Date(a.date).toDateString() === day);
            return dayActivities
                .filter(a => a.accessType === 'subscription' || a.accessType === 'purchase')
                .reduce((sum, a) => {
                    const price = a.accessType === 'subscription' ? 25000 : 15000;
                    return sum + price;
                }, 0);
        });

        const ctxRevenue = document.getElementById('dailyRevenueChart').getContext('2d');
        charts.revenue = new Chart(ctxRevenue, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Revenue (TSh)',
                    data: revenueByDay,
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
                    legend: {
                        labels: { color: '#9aa2d7', boxWidth: 12 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7', maxTicksLimit: 15 }
                    }
                }
            }
        });

        // Revenue Breakdown Chart
        const subscriptionRevenue = activities
            .filter(a => a.accessType === 'subscription')
            .reduce((sum) => sum + 25000, 0);
        const purchaseRevenue = activities
            .filter(a => a.accessType === 'purchase')
            .reduce((sum) => sum + 15000, 0);

        const ctxBreakdown = document.getElementById('revenueBreakdownChart').getContext('2d');
        charts.breakdown = new Chart(ctxBreakdown, {
            type: 'pie',
            data: {
                labels: ['Subscription', 'Single Purchase'],
                datasets: [{
                    data: [subscriptionRevenue, purchaseRevenue],
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

        // Monthly Trends Chart
        const monthLabels = [];
        const monthData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            const monthStr = date.toLocaleString('sw', { month: 'short' });
            monthLabels.push(monthStr);
            
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            const monthActivities = activities.filter(a => {
                const aDate = new Date(a.date);
                return aDate >= monthStart && aDate < monthEnd;
            });
            const revenue = monthActivities
                .filter(a => a.accessType === 'subscription' || a.accessType === 'purchase')
                .reduce((sum, a) => {
                    const price = a.accessType === 'subscription' ? 25000 : 15000;
                    return sum + price;
                }, 0);
            monthData.push(revenue);
        }

        const ctxMonthly = document.getElementById('monthlyTrendsChart').getContext('2d');
        charts.monthly = new Chart(ctxMonthly, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Revenue (TSh)',
                    data: monthData,
                    backgroundColor: 'rgba(108,99,255,0.6)',
                    borderColor: '#6c63ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9aa2d7', boxWidth: 12 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7' }
                    }
                }
            }
        });

        // Daily Activity Chart
        const ctxDaily = document.getElementById('dailyActivityChart').getContext('2d');
        charts.daily = new Chart(ctxDaily, {
            type: 'bar',
            data: {
                labels: days.slice(-14),
                datasets: [{
                    label: 'Activities',
                    data: viewsByDay.slice(-14),
                    backgroundColor: 'rgba(108,99,255,0.6)',
                    borderColor: '#6c63ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7', maxTicksLimit: 10 }
                    }
                }
            }
        });

        // Hourly Activity Chart
        const ctxHourly = document.getElementById('hourlyActivityChart').getContext('2d');
        charts.hourly = new Chart(ctxHourly, {
            type: 'bar',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: 'Activities',
                    data: hourData,
                    backgroundColor: 'rgba(249,115,22,0.6)',
                    borderColor: '#f97316',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7', maxTicksLimit: 12 }
                    }
                }
            }
        });

        // Activity Type Chart
        const typeCounts = {
            free_trial: activities.filter(a => a.accessType === 'free_trial').length,
            subscription: activities.filter(a => a.accessType === 'subscription').length,
            purchase: activities.filter(a => a.accessType === 'purchase').length,
            denied: activities.filter(a => a.accessType === 'denied').length
        };

        const ctxType = document.getElementById('activityTypeChart').getContext('2d');
        charts.type = new Chart(ctxType, {
            type: 'pie',
            data: {
                labels: ['Free Trial', 'Subscription', 'Single Purchase', 'Denied'],
                datasets: [{
                    data: [typeCounts.free_trial, typeCounts.subscription, typeCounts.purchase, typeCounts.denied],
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

        // Watch Time Distribution Chart
        const distribution = {
            '0-1m': 0,
            '1-5m': 0,
            '5-10m': 0,
            '10-30m': 0,
            '30-60m': 0,
            '60+m': 0
        };

        activities.forEach(a => {
            if (a.watchDuration <= 1) distribution['0-1m']++;
            else if (a.watchDuration <= 5) distribution['1-5m']++;
            else if (a.watchDuration <= 10) distribution['5-10m']++;
            else if (a.watchDuration <= 30) distribution['10-30m']++;
            else if (a.watchDuration <= 60) distribution['30-60m']++;
            else distribution['60+m']++;
        });

        const ctxDistribution = document.getElementById('watchTimeDistributionChart').getContext('2d');
        charts.distribution = new Chart(ctxDistribution, {
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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9aa2d7' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#9aa2d7' }
                    }
                }
            }
        });
    }

    // ===== User Profile Modal =====
    window.viewUserProfile = function(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        selectedUser = user;
        document.getElementById('profileModalTitle').textContent = `Profaili: ${user.name}`;
        
        // Show modal
        document.getElementById('userProfileModal').classList.add('active');
        
        // Render profile tabs
        renderProfileTab('basic');
    };

    function renderProfileTab(tab) {
        if (!selectedUser) return;
        
        const user = selectedUser;
        const tabContent = document.getElementById(`profile${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        
        // Update tab buttons
        document.querySelectorAll('.profile-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        // Hide all tab contents
        document.querySelectorAll('.profile-tab-content').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show selected tab
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
        const registered = new Date(user.registered).toLocaleString('sw');
        const firstWatch = user.firstWatch ? new Date(user.firstWatch).toLocaleString('sw') : 'Bado hajatazama';
        
        container.innerHTML = `
            <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.5rem;">
                <div class="profile-avatar-large" style="background:${avatarColor}">
                    ${user.photo ? `<img src="${user.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : getUserInitials(user.name)}
                </div>
                <div>
                    <h3 style="font-size:1.3rem;">${user.name}</h3>
                    <p style="color:var(--text-secondary);">${user.email}</p>
                    <p style="color:var(--text-secondary);">${user.phone || 'N/A'}</p>
                </div>
            </div>
            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span class="profile-info-label">Nchi</span>
                    <span class="profile-info-value">${user.country}</span>
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
                    <span class="profile-info-value">${user.firstWatch ? 'Ndiyo' : 'Hapana'}</span>
                </div>
            </div>
        `;
    }

    function renderProfileWatchSummary(user) {
        const userActivities = activities.filter(a => a.userId === user.id);
        const totalViews = userActivities.length;
        const completedViews = userActivities.filter(a => a.status === 'completed').length;
        const totalWatchTime = userActivities.reduce((sum, a) => sum + a.watchDuration, 0);
        const avgWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;
        const uniqueMovies = new Set(userActivities.map(a => a.movieId)).size;

        const container = document.getElementById('profileWatchSummary');
        container.innerHTML = `
            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span class="profile-info-label">Jumla ya Kutazama</span>
                    <span class="profile-info-value">${totalViews}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Zilizokamilika</span>
                    <span class="profile-info-value">${completedViews}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Jumla ya Muda</span>
                    <span class="profile-info-value">${formatDuration(totalWatchTime)}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Wastani wa Muda</span>
                    <span class="profile-info-value">${formatDuration(Math.round(avgWatchTime))}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Movie Pekee</span>
                    <span class="profile-info-value">${uniqueMovies}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Kiwango cha Kukamilisha</span>
                    <span class="profile-info-value">${totalViews > 0 ? Math.round((completedViews / totalViews) * 100) : 0}%</span>
                </div>
            </div>
        `;
    }

    function renderProfileWatchHistory(user) {
        const userActivities = activities.filter(a => a.userId === user.id).slice(0, 50);
        const container = document.getElementById('profileWatchHistory');
        
        if (userActivities.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna historia ya kutazama</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${userActivities.map(a => `
                        <div class="watch-history-item">
                            <span>${a.movieTitle}</span>
                            <span>${formatDuration(a.watchDuration)}</span>
                            <span class="status-badge status-${a.status}">${getStatusLabel(a.status)}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(a.date).toLocaleString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfileSubscriptions(user) {
        const userSubscriptions = sampleData.subscriptions[user.id] || [];
        const container = document.getElementById('profileSubscriptions');
        
        if (userSubscriptions.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna usajili</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${userSubscriptions.map(s => `
                        <div class="watch-history-item">
                            <span>${s.plan}</span>
                            <span>${formatCurrency(s.price)}</span>
                            <span class="status-badge ${s.status === 'active' ? 'status-active' : 'status-inactive'}">${s.status === 'active' ? 'Inatumika' : 'Imekwisha'}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(s.startDate).toLocaleDateString('sw')} - ${new Date(s.endDate).toLocaleDateString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfilePurchases(user) {
        const userPurchases = activities
            .filter(a => a.userId === user.id && a.accessType === 'purchase')
            .slice(0, 50);
        const container = document.getElementById('profilePurchases');
        
        if (userPurchases.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna manunuzi</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${userPurchases.map(a => `
                        <div class="watch-history-item">
                            <span>${a.movieTitle}</span>
                            <span>${formatCurrency(15000)}</span>
                            <span class="status-badge status-${a.status}">${getStatusLabel(a.status)}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(a.date).toLocaleString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfilePayments(user) {
        const userPayments = sampleData.paymentHistory[user.id] || [];
        const container = document.getElementById('profilePayments');
        
        if (userPayments.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna historia ya malipo</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${userPayments.map(p => `
                        <div class="watch-history-item">
                            <span>${p.ref}</span>
                            <span>${formatCurrency(p.amount)}</span>
                            <span>${p.method}</span>
                            <span class="status-badge ${p.status === 'completed' ? 'status-confirmed' : 'status-incomplete'}">${p.status === 'completed' ? 'Imekamilika' : 'Imeshindwa'}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(p.date).toLocaleString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function renderProfileAccessAttempts(user) {
        const userAccessAttempts = sampleData.accessAttempts[user.id] || [];
        const container = document.getElementById('profileAccessAttempts');
        
        if (userAccessAttempts.length === 0) {
            container.innerHTML = '<div class="empty-state">Hakuna majaribio ya kuingia yaliyokataliwa</div>';
        } else {
            container.innerHTML = `
                <div class="watch-history-list">
                    ${userAccessAttempts.map(a => `
                        <div class="watch-history-item">
                            <span>${a.movieTitle}</span>
                            <span style="color:var(--accent-red);">Imekataliwa</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${a.reason}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(a.date).toLocaleString('sw')}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
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
            const userId = selectedRow.getAttribute('onclick')?.match(/\d+/);
            if (userId) {
                viewUserProfile(parseInt(userId[0]));
            }
        } else {
            alert('Tafadhari chagua mtumiaji kutoka kwenye orodha');
        }
    });

    // ===== Event Listeners =====
    // Activity Feed Filters
    document.getElementById('activitySearch').addEventListener('input', function() {
        renderActivityFeed(1);
    });

    document.getElementById('activityTypeFilter').addEventListener('change', function() {
        renderActivityFeed(1);
    });

    // Activity Feed Pagination
    document.querySelectorAll('#activityPagination .pagination-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.page === 'prev') {
                renderActivityFeed(currentActivityPage - 1);
            } else if (this.dataset.page === 'next') {
                renderActivityFeed(currentActivityPage + 1);
            }
        });
    });

    // Detail Filters
    document.getElementById('detailSearch').addEventListener('input', function() {
        renderActivityDetails(1);
    });

    document.getElementById('detailTypeFilter').addEventListener('change', function() {
        renderActivityDetails(1);
    });

    // Detail Pagination
    document.querySelectorAll('#detailPagination .pagination-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.page === 'prev') {
                renderActivityDetails(currentDetailPage - 1);
            } else if (this.dataset.page === 'next') {
                renderActivityDetails(currentDetailPage + 1);
            }
        });
    });

    // Content Sort
    document.getElementById('contentSortFilter').addEventListener('change', function() {
        renderContentPerformance();
    });

    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.classList.add('fa-spin');
        setTimeout(() => {
            renderAll();
            icon.classList.remove('fa-spin');
        }, 500);
    });

    // Date Range Filters
    document.getElementById('dateFrom').addEventListener('change', function() {
        filterByDateRange();
    });

    document.getElementById('dateTo').addEventListener('change', function() {
        filterByDateRange();
    });

    function filterByDateRange() {
        const from = document.getElementById('dateFrom').value;
        const to = document.getElementById('dateTo').value;
        
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59);
            
            // Filter activities
            const filtered = activities.filter(a => {
                const aDate = new Date(a.date);
                return aDate >= fromDate && aDate <= toDate;
            });
            
            if (filtered.length > 0) {
                renderActivityFeed(1);
                renderActivityDetails(1);
            }
        }
    }

    // ===== Render All =====
    function renderAll() {
        renderOverviewStats();
        renderActivityFeed(1);
        renderActivityDetails(1);
        renderUserEngagement();
        renderContentPerformance();
        renderRevenueAnalytics();
        renderDropoffAnalysis();
        renderTopActiveUsers();
        
        // Destroy old charts if they exist
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
        
        // Reinitialize charts
        initializeCharts();
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
    renderAll();

    // Set admin email
    try {
        const userData = localStorage.getItem('tanzaflix_user');
        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.email) {
                document.getElementById('adminEmail').textContent = parsed.email;
            }
        }
    } catch (e) {}

    console.log('📊 Activities Dashboard Loaded');
    console.log('📈 Total Activities:', activities.length);
    console.log('👥 Total Users:', users.length);
    console.log('🎬 Total Movies:', movies.length);
});