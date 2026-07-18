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

    // ===== Sample Data =====
    let movies = [
        { id: 1, title: 'Safari ya Mtaa', type: 'Haijatafsiriwa', country: 'Bongo', lang: 'Kiswahili', category: 'Action', year: 2024, price: 15000, description: 'Hadithi ya kusisimua ya mitaa ya Dar', moreLike: [2, 3] },
        { id: 2, title: 'The Silent Shore', type: 'Imetafsiriwa', country: 'Kihindi', lang: 'Hindi', category: 'Drama', year: 2023, price: 20000, description: 'Love story along the coast', moreLike: [1, 4] },
        { id: 3, title: 'Mapenzi ya Mwanga', type: 'Haijatafsiriwa', country: 'Bongo', lang: 'Kiswahili', category: 'Love story', year: 2024, price: 12000, description: 'Romance in the city', moreLike: [] },
        { id: 4, title: 'Bollywood Dreams', type: 'Imetafsiriwa', country: 'Kihindi', lang: 'Hindi', category: 'Mix', year: 2024, price: 25000, description: 'Indian cinema experience', moreLike: [2] },
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

    let nextMovieId = 5;
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
        tbody.innerHTML = movies.map(m => `
            <tr>
                <td><strong>${m.title}</strong></td>
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
        `).join('');
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

    // ===== Global Functions =====
    window.viewMovie = function(id) {
        const movie = movies.find(m => m.id === id);
        if (movie) {
            alert(`📽️ Jina: ${movie.title}\nAina: ${movie.type}\nNchi: ${movie.country}\nLugha: ${movie.lang}\nKategoria: ${movie.category}\nMwaka: ${movie.year}\nBei: TSh ${movie.price.toLocaleString()}\nMaelezo: ${movie.description || '-'}`);
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

    document.getElementById('movieForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('movieId').value;
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
        };

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
        document.body.style.overflow = 'hidden';
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    // ===== Toast Notification =====
    function showToast(message) {
        // Create container if not exists
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== Initialize =====
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