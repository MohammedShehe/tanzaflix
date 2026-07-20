document.addEventListener('DOMContentLoaded', function() {
    // ===== Check Admin Session =====
    const adminSession = localStorage.getItem('tanzaflix_admin_session');
    console.log('Admin session check:', adminSession);
    
    if (!adminSession) {
        console.log('No admin session, redirecting to login...');
        window.location.href = 'index.html';
        return;
    }

    // ===== State =====
    let currentTab = 'movies';
    let deleteTarget = null;
    let deleteType = null;
    let seasonCounter = 0;

    // ===== Sample Data =====
    let movies = [
        { 
            id: 1, 
            title: 'Safari ya Mtaa', 
            type: 'Haijatafsiriwa', 
            country: 'Bongo', 
            lang: 'Kiswahili', 
            category: 'Action', 
            year: 2024, 
            price: 15000, 
            description: 'Hadithi ya kusisimua ya mitaa ya Dar', 
            moreLike: [2, 3],
            contentType: 'single',
            duration: '2h 10m',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        },
        { 
            id: 2, 
            title: 'The Silent Shore', 
            type: 'Imetafsiriwa', 
            country: 'Kihindi', 
            lang: 'Hindi', 
            category: 'Drama', 
            year: 2023, 
            price: 20000, 
            description: 'Love story along the coast', 
            moreLike: [1, 4],
            contentType: 'single',
            duration: '2h 20m',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        },
        { 
            id: 3, 
            title: 'Mapenzi ya Mwanga', 
            type: 'Haijatafsiriwa', 
            country: 'Bongo', 
            lang: 'Kiswahili', 
            category: 'Love story', 
            year: 2024, 
            price: 12000, 
            description: 'Romance in the city', 
            moreLike: [],
            contentType: 'single',
            duration: '1h 55m',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        },
        { 
            id: 4, 
            title: 'Bollywood Dreams', 
            type: 'Imetafsiriwa', 
            country: 'Kihindi', 
            lang: 'Hindi', 
            category: 'Mix', 
            year: 2024, 
            price: 25000, 
            description: 'Indian cinema experience', 
            moreLike: [2],
            contentType: 'single',
            duration: '2h 35m',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        },
        // Series Example
        {
            id: 7,
            title: 'Mafia: The Untold Story',
            type: 'Imetafsiriwa',
            country: 'Bongo',
            lang: 'Kiswahili',
            category: 'Action',
            year: 2024,
            price: 35000,
            description: 'A gripping crime series set in the underworld of Dar es Salaam.',
            moreLike: [],
            contentType: 'series',
            duration: '45m per episode',
            seasons: {
                1: {
                    label: 'S01',
                    episodes: [
                        { num: 'E01', title: 'The Beginning', duration: '45m', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        { num: 'E02', title: 'The Awakening', duration: '42m', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        { num: 'E03', title: 'Rising Power', duration: '48m', video: 'https://www.w3schools.com/html/mov_bbb.mp4' }
                    ]
                },
                2: {
                    label: 'S02',
                    episodes: [
                        { num: 'E01', title: 'New Era', duration: '46m', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                        { num: 'E02', title: 'Rivalry', duration: '43m', video: 'https://www.w3schools.com/html/mov_bbb.mp4' }
                    ]
                }
            }
        }
    ];

    let users = [
        { id: 1, fullName: 'John Doe', email: 'john@example.com', phone: '0712345678', country: 'Tanzania', region: 'Dar es Salaam', password: 'hashed123', photo: 'https://ui-avatars.com/api/?name=John+Doe&background=6c63ff&color=fff&size=60' },
        { id: 2, fullName: 'Jane Smith', email: 'jane@example.com', phone: '0723456789', country: 'Kenya', region: 'Nairobi', password: 'hashed456', photo: 'https://ui-avatars.com/api/?name=Jane+Smith&background=ff4eb0&color=fff&size=60' },
        { id: 3, fullName: 'Ali Hassan', email: 'ali@example.com', phone: '0734567890', country: 'Tanzania', region: 'Zanzibar', password: 'hashed789', photo: 'https://ui-avatars.com/api/?name=Ali+Hassan&background=22c55e&color=fff&size=60' },
    ];

    let transactions = [
        { id: 1, userId: 1, userName: 'John Doe', movieId: 1, movieTitle: 'Safari ya Mtaa', amount: 15000, status: 'confirmed', date: '2024-01-15 14:30' },
        { id: 2, userId: 2, userName: 'Jane Smith', movieId: 3, movieTitle: 'Mapenzi ya Mwanga', amount: 12000, status: 'processing', date: '2024-01-16 09:15' },
        { id: 3, userId: 3, userName: 'Ali Hassan', movieId: 2, movieTitle: 'The Silent Shore', amount: 20000, status: 'confirmed', date: '2024-01-16 18:45' },
        { id: 4, userId: 1, userName: 'John Doe', movieId: 4, movieTitle: 'Bollywood Dreams', amount: 25000, status: 'processing', date: '2024-01-17 11:00' },
    ];

    let activities = [
        { userId: 1, userName: 'John Doe', status: 'active', role: 'subscriber', login: '2024-01-17 10:30', logout: '2024-01-17 12:45', purchased: ['Safari ya Mtaa', 'Bollywood Dreams'] },
        { userId: 2, userName: 'Jane Smith', status: 'inactive', role: 'guest', login: '2024-01-16 08:00', logout: '2024-01-16 09:30', purchased: ['Mapenzi ya Mwanga'] },
        { userId: 3, userName: 'Ali Hassan', status: 'active', role: 'subscriber', login: '2024-01-17 14:00', logout: '2024-01-17 16:20', purchased: ['The Silent Shore'] },
    ];

    let nextMovieId = 8;
    let nextUserId = 4;
    let nextTransactionId = 5;

    // ===== DOM Elements =====
    const tabs = document.querySelectorAll('.nav-item');
    const tabContents = {
        movies: document.getElementById('moviesTab'),
        users: document.getElementById('usersTab'),
        transactions: document.getElementById('transactionsTab'),
        activities: document.getElementById('activitiesTab'),
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
            localStorage.removeItem('tanzaflix_user');
            localStorage.removeItem('tanzaflix_admin_session');
            window.location.href = 'index.html';
        }
    });

    // ===== Tab Navigation =====
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            Object.keys(tabContents).forEach(key => {
                tabContents[key].classList.remove('active');
            });
            tabContents[tabName].classList.add('active');
            currentTab = tabName;
            renderAll();
        });
    });

    // ===== Render Functions =====
    function renderMovies() {
        const tbody = document.getElementById('moviesTableBody');
        if (!movies.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Hakuna movies zilizosajiliwa</td></tr>`;
            return;
        }
        tbody.innerHTML = movies.map(m => {
            const contentTypeBadge = m.contentType === 'series' 
                ? '<span class="badge-series">📺 Series</span>' 
                : '<span class="badge-single">🎬 Single</span>';
            return `
            <tr>
                <td><strong>${m.title}</strong> ${contentTypeBadge}</td>
                <td><span class="status-badge ${m.type === 'Imetafsiriwa' ? 'status-confirmed' : 'status-processing'}">${m.type}</span></td>
                <td>${m.country}</td>
                <td>${m.lang}</td>
                <td>${m.category}</td>
                <td>${m.year}</td>
                <td>TSh ${m.price.toLocaleString()}</td>
                <td>
                    <button class="action-btn action-btn-view" onclick="viewMovie(${m.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn action-btn-edit" onclick="editMovie(${m.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn action-btn-delete" onclick="deleteMovie(${m.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
    }

    function renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hakuna watumizi waliosajiliwa</td></tr>`;
            return;
        }
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.fullName}</td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td>${u.country}</td>
                <td>${u.region || '-'}</td>
                <td>
                    ${u.photo ? `<img src="${u.photo}" alt="${u.fullName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.1);" />` : '-'}
                </td>
                <td>
                    <button class="action-btn action-btn-view" onclick="viewUser(${u.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn action-btn-edit" onclick="editUser(${u.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn action-btn-delete" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderTransactions() {
        const tbody = document.getElementById('transactionsTableBody');
        const totalIncome = transactions.filter(t => t.status === 'confirmed').reduce((sum, t) => sum + t.amount, 0);
        const completed = transactions.filter(t => t.status === 'confirmed').length;
        const pending = transactions.filter(t => t.status === 'processing').length;
        const customers = new Set(transactions.filter(t => t.status === 'confirmed').map(t => t.userId)).size;

        document.getElementById('totalIncome').textContent = `TSh ${totalIncome.toLocaleString()}`;
        document.getElementById('completedTransactions').textContent = completed;
        document.getElementById('pendingTransactions').textContent = pending;
        document.getElementById('totalCustomers').textContent = customers;

        if (!transactions.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hakuna manunuzi yaliyofanywa</td></tr>`;
            return;
        }
        tbody.innerHTML = transactions.map((t, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${t.userName}</td>
                <td>${t.movieTitle}</td>
                <td>TSh ${t.amount.toLocaleString()}</td>
                <td><span class="status-badge ${t.status === 'confirmed' ? 'status-confirmed' : 'status-processing'}">${t.status === 'confirmed' ? 'Imekamilika' : 'Inasubiri'}</span></td>
                <td>${t.date}</td>
                <td>
                    ${t.status === 'processing' ? `<button class="action-btn action-btn-edit" onclick="confirmTransaction(${t.id})"><i class="fas fa-check"></i></button>` : ''}
                    <button class="action-btn action-btn-delete" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderActivities() {
        const tbody = document.getElementById('activitiesTableBody');
        if (!activities.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hakuna shughuli zilizorekodiwa</td></tr>`;
            return;
        }
        tbody.innerHTML = activities.map(a => `
            <tr>
                <td><strong>${a.userName}</strong></td>
                <td><span class="status-badge ${a.status === 'active' ? 'status-active' : 'status-inactive'}">${a.status === 'active' ? 'Anaendelea' : 'Hajafanya'}</span></td>
                <td><span class="status-badge ${a.role === 'subscriber' ? 'status-confirmed' : 'status-processing'}">${a.role}</span></td>
                <td>${a.login}</td>
                <td>${a.logout}</td>
                <td>${a.purchased.join(', ') || '-'}</td>
                <td>
                    <button class="action-btn action-btn-view" onclick="viewActivity(${a.userId})"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderAll() {
        renderMovies();
        renderUsers();
        renderTransactions();
        renderActivities();
    }

    // ===== Series Functions =====
    function addSeason(seasonData = null) {
        seasonCounter++;
        const seasonNum = seasonCounter;
        const container = document.getElementById('seasonsContainer');
        
        const seasonDiv = document.createElement('div');
        seasonDiv.className = 'season-group';
        seasonDiv.dataset.season = seasonNum;
        seasonDiv.innerHTML = `
            <div class="season-header">
                <h4><span class="season-number">S${String(seasonNum).padStart(2, '0')}</span></h4>
                <button type="button" class="remove-season" onclick="removeSeason(this)">Ondoa Season</button>
            </div>
            <div class="episodes-container" data-season="${seasonNum}">
                <!-- Episodes will be added here -->
            </div>
            <button type="button" class="add-episode-btn" onclick="addEpisode(this, ${seasonNum})">
                <i class="fas fa-plus"></i> Ongeza Episode
            </button>
        `;
        container.appendChild(seasonDiv);

        // If we have existing season data, populate it
        if (seasonData && seasonData.episodes) {
            const episodesContainer = seasonDiv.querySelector('.episodes-container');
            seasonData.episodes.forEach(ep => {
                addEpisodeToContainer(episodesContainer, seasonNum, ep);
            });
        }
    }

    window.addSeason = addSeason;

    function removeSeason(button) {
        if (confirm('Je, una uhakika unataka kuondoa season hii?')) {
            const seasonGroup = button.closest('.season-group');
            seasonGroup.remove();
            // Re-number seasons
            renumberSeasons();
        }
    }

    window.removeSeason = removeSeason;

    function renumberSeasons() {
        const seasonGroups = document.querySelectorAll('.season-group');
        seasonGroups.forEach((group, index) => {
            const num = index + 1;
            const seasonNumberSpan = group.querySelector('.season-number');
            if (seasonNumberSpan) {
                seasonNumberSpan.textContent = `S${String(num).padStart(2, '0')}`;
            }
            group.dataset.season = num;
            const episodesContainer = group.querySelector('.episodes-container');
            if (episodesContainer) {
                episodesContainer.dataset.season = num;
            }
        });
        seasonCounter = seasonGroups.length;
    }

    function addEpisode(button, seasonNum) {
        const seasonGroup = button.closest('.season-group');
        const episodesContainer = seasonGroup.querySelector('.episodes-container');
        addEpisodeToContainer(episodesContainer, seasonNum);
    }

    window.addEpisode = addEpisode;

    function addEpisodeToContainer(container, seasonNum, episodeData = null) {
        const episodeCount = container.querySelectorAll('.episode-item').length + 1;
        
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'episode-item';
        episodeDiv.innerHTML = `
            <div class="form-group">
                <label>Jina la Episode</label>
                <input type="text" class="episode-title" placeholder="Jina la episode" value="${episodeData ? episodeData.title : ''}" />
            </div>
            <div class="form-group">
                <label>Muda</label>
                <input type="text" class="episode-duration" placeholder="45m" value="${episodeData ? episodeData.duration : ''}" />
            </div>
            <div class="form-group">
                <label>Video</label>
                <input type="file" class="episode-video" accept="video/*,.mp4,.mkv,.avi" />
                ${episodeData && episodeData.video ? `<small style="display:block;margin-top:4px;color:var(--text-muted);">Video iliyopo: ${episodeData.video.split('/').pop() || 'imewekwa'}</small>` : ''}
                ${episodeData && episodeData.video ? `<input type="hidden" class="episode-video-url" value="${episodeData.video}" />` : ''}
            </div>
            <button type="button" class="remove-episode" onclick="removeEpisode(this)"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(episodeDiv);
    }

    function removeEpisode(button) {
        if (confirm('Je, una uhakika unataka kuondoa episode hii?')) {
            const episodeItem = button.closest('.episode-item');
            episodeItem.remove();
        }
    }

    window.removeEpisode = removeEpisode;

    // ===== Collect Series Data =====
    function collectSeriesData() {
        const seasons = {};
        const seasonGroups = document.querySelectorAll('.season-group');
        
        seasonGroups.forEach((group, index) => {
            const seasonNum = index + 1;
            const episodesContainer = group.querySelector('.episodes-container');
            const episodeItems = episodesContainer.querySelectorAll('.episode-item');
            const episodes = [];
            
            episodeItems.forEach((ep, epIndex) => {
                const title = ep.querySelector('.episode-title').value.trim() || `Episode ${epIndex + 1}`;
                const duration = ep.querySelector('.episode-duration').value.trim() || '45m';
                const videoFile = ep.querySelector('.episode-video');
                const videoUrlInput = ep.querySelector('.episode-video-url');
                
                let video = '';
                if (videoUrlInput) {
                    video = videoUrlInput.value;
                } else if (videoFile && videoFile.files.length > 0) {
                    video = URL.createObjectURL(videoFile.files[0]);
                }
                
                episodes.push({
                    num: `E${String(epIndex + 1).padStart(2, '0')}`,
                    title: title,
                    duration: duration,
                    video: video || 'https://www.w3schools.com/html/mov_bbb.mp4'
                });
            });
            
            if (episodes.length > 0) {
                seasons[seasonNum] = {
                    label: `S${String(seasonNum).padStart(2, '0')}`,
                    episodes: episodes
                };
            }
        });
        
        return seasons;
    }

    // ===== Content Type Toggle =====
    function setupContentTypeToggle() {
        const radios = document.querySelectorAll('input[name="contentType"]');
        const singleFields = document.getElementById('singleMovieFields');
        const seriesFields = document.getElementById('seriesFields');
        const labels = document.querySelectorAll('.content-type-selector label');

        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                // Update label styles
                labels.forEach(label => label.classList.remove('selected'));
                this.closest('label').classList.add('selected');

                if (this.value === 'single') {
                    singleFields.style.display = 'block';
                    seriesFields.classList.remove('visible');
                    // Clear seasons when switching to single
                    document.getElementById('seasonsContainer').innerHTML = '';
                    seasonCounter = 0;
                } else {
                    singleFields.style.display = 'none';
                    seriesFields.classList.add('visible');
                    // If no seasons exist, add one
                    if (document.querySelectorAll('.season-group').length === 0) {
                        addSeason();
                    }
                }
            });
        });
    }

    // ===== Global Functions =====
    window.viewMovie = function(id) {
        const movie = movies.find(m => m.id === id);
        if (movie) {
            let info = `📽️ Jina: ${movie.title}\n`;
            info += `Aina: ${movie.type}\n`;
            info += `Nchi: ${movie.country}\n`;
            info += `Lugha: ${movie.lang}\n`;
            info += `Kategoria: ${movie.category}\n`;
            info += `Mwaka: ${movie.year}\n`;
            info += `Bei: TSh ${movie.price.toLocaleString()}\n`;
            info += `Muda: ${movie.duration || '-'}\n`;
            info += `Aina ya Maudhui: ${movie.contentType === 'series' ? 'Series' : 'Single Movie'}\n`;
            info += `Maelezo: ${movie.description || '-'}\n`;
            
            if (movie.contentType === 'series' && movie.seasons) {
                info += `\n📺 Seasons: ${Object.keys(movie.seasons).length}\n`;
                Object.keys(movie.seasons).forEach(key => {
                    const season = movie.seasons[key];
                    info += `  ${season.label}: ${season.episodes.length} episodes\n`;
                });
            }
            alert(info);
        }
    };

    window.editMovie = function(id) {
        const movie = movies.find(m => m.id === id);
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
        const user = users.find(u => u.id === id);
        if (user) {
            alert(`👤 Jina: ${user.fullName}\nBarua pepe: ${user.email}\nSimu: ${user.phone}\nNchi: ${user.country}\nEneo: ${user.region || '-'}`);
        }
    };

    window.editUser = function(id) {
        const user = users.find(u => u.id === id);
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
        const trans = transactions.find(t => t.id === id);
        if (trans) {
            trans.status = 'confirmed';
            renderAll();
            showToast('Manunuzi yamekamilika!');
        }
    };

    window.deleteTransaction = function(id) {
        if (confirm('Je, una uhakika unataka kufuta transaction hii?')) {
            transactions = transactions.filter(t => t.id !== id);
            renderAll();
            showToast('Transaction imefutwa!');
        }
    };

    window.viewActivity = function(id) {
        const activity = activities.find(a => a.userId === id);
        if (activity) {
            alert(`📊 Mtumiaji: ${activity.userName}\nHali: ${activity.status}\nJukumu: ${activity.role}\nImeingia: ${activity.login}\nImetoka: ${activity.logout}\nMovie Zilizonunuliwa: ${activity.purchased.join(', ') || '-'}`);
        }
    };

    // ===== Movie Modal =====
    function openMovieModal(movie = null) {
        const modal = document.getElementById('movieModal');
        const form = document.getElementById('movieForm');
        const title = document.getElementById('movieModalTitle');
        const seasonsContainer = document.getElementById('seasonsContainer');

        // Clear previous seasons
        seasonsContainer.innerHTML = '';
        seasonCounter = 0;

        if (movie) {
            title.textContent = 'Hariri Movie';
            document.getElementById('movieId').value = movie.id;
            document.getElementById('movieTitle').value = movie.title;
            document.getElementById('movieType').value = movie.type;
            document.getElementById('movieCountry').value = movie.country;
            document.getElementById('movieLang').value = movie.lang;
            document.getElementById('movieCategory').value = movie.category;
            document.getElementById('movieYear').value = movie.year;
            document.getElementById('moviePrice').value = movie.price;
            document.getElementById('movieDescription').value = movie.description || '';
            document.getElementById('movieDuration').value = movie.duration || '';
            
            // Set content type
            const contentType = movie.contentType || 'single';
            document.querySelector(`input[name="contentType"][value="${contentType}"]`).checked = true;
            const labels = document.querySelectorAll('.content-type-selector label');
            labels.forEach(label => label.classList.remove('selected'));
            document.querySelector(`input[name="contentType"][value="${contentType}"]`).closest('label').classList.add('selected');

            // Toggle fields
            const singleFields = document.getElementById('singleMovieFields');
            const seriesFields = document.getElementById('seriesFields');
            if (contentType === 'series') {
                singleFields.style.display = 'none';
                seriesFields.classList.add('visible');
                // Populate seasons
                if (movie.seasons) {
                    Object.keys(movie.seasons).forEach(key => {
                        const season = movie.seasons[key];
                        addSeason(season);
                    });
                }
                if (document.querySelectorAll('.season-group').length === 0) {
                    addSeason();
                }
            } else {
                singleFields.style.display = 'block';
                seriesFields.classList.remove('visible');
            }
            
            const moreLikeSelect = document.getElementById('movieMoreLike');
            moreLikeSelect.innerHTML = '';
            movies.forEach(m => {
                if (m.id !== movie.id) {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = m.title;
                    if (movie.moreLike && movie.moreLike.includes(m.id)) {
                        opt.selected = true;
                    }
                    moreLikeSelect.appendChild(opt);
                }
            });
        } else {
            title.textContent = 'Ongeza Movie';
            form.reset();
            document.getElementById('movieId').value = '';
            document.getElementById('singleMovieFields').style.display = 'block';
            document.getElementById('seriesFields').classList.remove('visible');
            
            // Set default radio
            document.querySelector('input[name="contentType"][value="single"]').checked = true;
            const labels = document.querySelectorAll('.content-type-selector label');
            labels.forEach(label => label.classList.remove('selected'));
            document.querySelector('input[name="contentType"][value="single"]').closest('label').classList.add('selected');

            const moreLikeSelect = document.getElementById('movieMoreLike');
            moreLikeSelect.innerHTML = '';
            movies.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.title;
                moreLikeSelect.appendChild(opt);
            });
        }

        openModal('movieModal');
    }

    document.getElementById('addMovieBtn').addEventListener('click', function() {
        openMovieModal(null);
    });

    // Fix: Add event listener for the Add Season button
    document.getElementById('addSeasonBtn').addEventListener('click', function() {
        addSeason();
    });

    document.getElementById('movieForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('movieId').value;
        const contentType = document.querySelector('input[name="contentType"]:checked').value;
        
        const data = {
            title: document.getElementById('movieTitle').value.trim(),
            type: document.getElementById('movieType').value,
            country: document.getElementById('movieCountry').value,
            lang: document.getElementById('movieLang').value.trim(),
            category: document.getElementById('movieCategory').value,
            year: parseInt(document.getElementById('movieYear').value),
            price: parseInt(document.getElementById('moviePrice').value),
            description: document.getElementById('movieDescription').value.trim(),
            moreLike: Array.from(document.getElementById('movieMoreLike').selectedOptions).map(o => parseInt(o.value)),
            contentType: contentType,
            duration: document.getElementById('movieDuration').value.trim() || 'N/A'
        };

        if (contentType === 'single') {
            const videoFile = document.getElementById('movieFile');
            if (videoFile && videoFile.files.length > 0) {
                data.videoUrl = URL.createObjectURL(videoFile.files[0]);
            } else if (id) {
                // Keep existing video URL if editing
                const existing = movies.find(m => m.id === parseInt(id));
                if (existing) data.videoUrl = existing.videoUrl;
            } else {
                data.videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
            }
        } else {
            // Series - collect seasons data
            const seasons = collectSeriesData();
            if (Object.keys(seasons).length === 0) {
                alert('Tafadhali ongeza angalau season moja na episode.');
                return;
            }
            data.seasons = seasons;
            data.videoUrl = ''; // Series don't have a single video URL
        }

        if (id) {
            const index = movies.findIndex(m => m.id === parseInt(id));
            if (index !== -1) {
                movies[index] = { ...movies[index], ...data };
                showToast('Movie imesasishwa!');
            }
        } else {
            data.id = nextMovieId++;
            movies.push(data);
            showToast('Movie imeongezwa!');
        }

        closeModal('movieModal');
        renderAll();
    });

    // ===== User Modal =====
    function openUserModal(user = null) {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');

        if (user) {
            title.textContent = 'Hariri Mtumiaji';
            document.getElementById('userId').value = user.id;
            document.getElementById('userFullName').value = user.fullName;
            document.getElementById('userPhone').value = user.phone;
            document.getElementById('userCountry').value = user.country;
            document.getElementById('userRegion').value = user.region || '';
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPassword').value = '';
            document.getElementById('userPasswordConfirm').value = '';
            document.getElementById('userPassword').placeholder = 'Acha tupu ili kubaki sawa';
            document.getElementById('userPasswordConfirm').placeholder = 'Acha tupu ili kubaki sawa';
            
            if (user.country === 'Tanzania') {
                document.getElementById('userRegionGroup').style.display = 'block';
            } else {
                document.getElementById('userRegionGroup').style.display = 'none';
            }
        } else {
            title.textContent = 'Ongeza Mtumiaji';
            form.reset();
            document.getElementById('userId').value = '';
            document.getElementById('userPassword').placeholder = 'Weka nenosiri';
            document.getElementById('userPasswordConfirm').placeholder = 'Rudia nenosiri';
            document.getElementById('userRegionGroup').style.display = 'none';
        }

        openModal('userModal');
    }

    document.getElementById('addUserBtn').addEventListener('click', function() {
        openUserModal(null);
    });

    document.getElementById('userCountry').addEventListener('change', function() {
        const regionGroup = document.getElementById('userRegionGroup');
        if (this.value === 'Tanzania') {
            regionGroup.style.display = 'block';
        } else {
            regionGroup.style.display = 'none';
        }
    });

    document.getElementById('userForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const password = document.getElementById('userPassword').value;
        const passwordConfirm = document.getElementById('userPasswordConfirm').value;

        if (!id && password !== passwordConfirm) {
            alert('Nenosiri hazilingani!');
            return;
        }

        if (!id && password.length < 6) {
            alert('Nenosiri lazima iwe na herufi 6 au zaidi!');
            return;
        }

        const fullName = document.getElementById('userFullName').value.trim();
        const data = {
            fullName: fullName,
            phone: document.getElementById('userPhone').value.trim(),
            country: document.getElementById('userCountry').value,
            region: document.getElementById('userRegion').value,
            email: document.getElementById('userEmail').value.trim(),
            photo: document.getElementById('userPhoto').files.length > 0 
                ? URL.createObjectURL(document.getElementById('userPhoto').files[0]) 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6c63ff&color=fff&size=60`
        };

        if (id) {
            const index = users.findIndex(u => u.id === parseInt(id));
            if (index !== -1) {
                users[index] = { ...users[index], ...data };
                if (password) {
                    users[index].password = 'hashed_' + password;
                }
                showToast('Mtumiaji amesasishwa!');
            }
        } else {
            data.id = nextUserId++;
            data.password = 'hashed_' + password;
            users.push(data);
            showToast('Mtumiaji ameongezwa!');
        }

        closeModal('userModal');
        renderAll();
    });

    // ===== Confirm Delete =====
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        if (deleteType === 'movie') {
            movies = movies.filter(m => m.id !== deleteTarget);
            showToast('Movie imefutwa!');
        } else if (deleteType === 'user') {
            users = users.filter(u => u.id !== deleteTarget);
            showToast('Mtumiaji amefutwa!');
        }
        deleteTarget = null;
        deleteType = null;
        closeModal('confirmModal');
        renderAll();
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

    // Add toast animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // ===== Initialize =====
    setupContentTypeToggle();
    renderAll();

    // Set admin email from localStorage
    try {
        const userData = localStorage.getItem('tanzaflix_user');
        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.email) {
                document.getElementById('adminEmail').textContent = parsed.email;
            }
        }
    } catch (e) {}

    console.log('🔐 Admin Panel Loaded');
    console.log('📊 Data:', { movies, users, transactions, activities });
});