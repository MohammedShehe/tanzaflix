// Dashboard entrance animation + simple analytics (click tally)
(function() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name') || 'Mgeni wa TanzaFlix';
  const kick = params.get('kick');

  const primary = document.getElementById('translatedOption');
  const secondary = document.getElementById('originalOption');

  const nameElement = document.getElementById('userName');
  if (nameElement) {
    nameElement.textContent = name;
  }

  // Load and display user photo from localStorage
  const userPhotoImg = document.getElementById('userPhoto');
  const noPhotoText = document.getElementById('noPhotoText');
  try {
    const userDataStr = localStorage.getItem('tanzaflix_user');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData.photo_url) {
        userPhotoImg.src = userData.photo_url;
        userPhotoImg.style.display = 'block';
        if (noPhotoText) noPhotoText.style.display = 'none';
      }
    }
  } catch (err) {
    console.warn('Error loading user photo:', err);
  }

  if (kick && (primary || secondary)) {
    if (primary) primary.classList.add('enter-zoom');
    if (secondary) secondary.classList.add('enter-slide');
    setTimeout(() => {
      if (primary) primary.classList.remove('enter-zoom');
      if (secondary) secondary.classList.remove('enter-slide');
    }, 1800);
  }

  const STORAGE_KEY = 'tanzaflix_choice_counts_v1';
  const loadCounts = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const saveCounts = (c) => localStorage.setItem(STORAGE_KEY, JSON.stringify(c));

  const renderRegisteredUsers = (users) => {
    const tableBody = document.getElementById('registeredUsersTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');

    if (!tableBody || !noUsersMessage) return;
    tableBody.innerHTML = '';

    if (!Array.isArray(users) || users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-state" id="noUsersMessage">Hakuna watumiaji waliopatikana.</td></tr>`;
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.id || ''}</td>
        <td>${user.full_name || user.name || ' - '}</td>
        <td>${user.email || ' - '}</td>
        <td>${user.phone || ' - '}</td>
        <td>${user.country || ' - '}</td>
        <td>${user.region || ' - '}</td>
        <td>${new Date(user.created_at || user.createdAt || Date.now()).toLocaleString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
      `;
      tableBody.appendChild(row);
    });
  };

  const loadRegisteredUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Haikuweza kupata watumiaji kutoka server.');
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Hitilafu kupakua watumiaji.');
      }
      renderRegisteredUsers(data.users || []);
    } catch (err) {
      const tableBody = document.getElementById('registeredUsersTableBody');
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">${String(err.message)}</td></tr>`;
      }
      console.error('Dashboard load users error:', err);
    }
  };

  loadRegisteredUsers();

  const setupCard = (el, targetUrl) => {
    if (!el) return;
    const id = el.id;
    const counts = loadCounts();
    const badge = document.createElement('span');
    badge.className = 'choice-badge';
    badge.textContent = counts[id] || 0;
    el.appendChild(badge);

    el.addEventListener('click', (e) => {
      e.preventDefault();
      const c = loadCounts();
      c[id] = (c[id] || 0) + 1;
      saveCounts(c);
      badge.textContent = c[id];
      el.classList.add('clicked');
      setTimeout(() => el.classList.remove('clicked'), 600);
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
  };

  setupCard(primary, 'movies.html?translated=1');
  setupCard(secondary, 'movies.html?translated=0');
})();
