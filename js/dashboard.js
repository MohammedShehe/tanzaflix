document.addEventListener('DOMContentLoaded', function() {
  // Get user name from URL
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name') || 'Mgeni wa TanzaFlix';

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

  // Render registered users with profile photos
  const renderRegisteredUsers = () => {
    const tableBody = document.getElementById('registeredUsersTableBody');
    if (!tableBody) return;

    // Sample users data with profile photos
    const users = [
      { 
        id: 1, 
        full_name: 'John Doe', 
        email: 'john@example.com', 
        phone: '0712345678', 
        country: 'Tanzania', 
        region: 'Dar es Salaam', 
        photo_url: 'https://ui-avatars.com/api/?name=John+Doe&background=6c63ff&color=fff&size=40',
        created_at: new Date(2024, 0, 15) 
      },
      { 
        id: 2, 
        full_name: 'Jane Smith', 
        email: 'jane@example.com', 
        phone: '0723456789', 
        country: 'Kenya', 
        region: 'Nairobi', 
        photo_url: 'https://ui-avatars.com/api/?name=Jane+Smith&background=ff4eb0&color=fff&size=40',
        created_at: new Date(2024, 1, 20) 
      },
      { 
        id: 3, 
        full_name: 'Ali Hassan', 
        email: 'ali@example.com', 
        phone: '0734567890', 
        country: 'Tanzania', 
        region: 'Zanzibar', 
        photo_url: 'https://ui-avatars.com/api/?name=Ali+Hassan&background=22c55e&color=fff&size=40',
        created_at: new Date(2024, 2, 10) 
      },
      { 
        id: 4, 
        full_name: 'Maria Jose', 
        email: 'maria@example.com', 
        phone: '0745678901', 
        country: 'Other', 
        region: 'Mozambique', 
        photo_url: 'https://ui-avatars.com/api/?name=Maria+Jose&background=f59e0b&color=fff&size=40',
        created_at: new Date(2024, 3, 5) 
      },
      { 
        id: 5, 
        full_name: 'Peter Ochieng', 
        email: 'peter@example.com', 
        phone: '0756789012', 
        country: 'Uganda', 
        region: 'Kampala', 
        photo_url: 'https://ui-avatars.com/api/?name=Peter+Ochieng&background=3b82f6&color=fff&size=40',
        created_at: new Date(2024, 4, 12) 
      },
    ];

    tableBody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.full_name}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${user.country}</td>
        <td>${user.region}</td>
        <td>
          <img src="${user.photo_url}" alt="${user.full_name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.1);" />
        </td>
        <td>${new Date(user.created_at).toLocaleString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
      </tr>
    `).join('');
  };

  renderRegisteredUsers();

  // Choice card click tracking
  const setupCard = (el) => {
    if (!el) return;
    const id = el.id;
    const STORAGE_KEY = 'tanzaflix_choice_counts_v1';
    const loadCounts = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const saveCounts = (c) => localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    
    const counts = loadCounts();
    const badge = document.createElement('span');
    badge.className = 'choice-badge';
    badge.textContent = counts[id] || 0;
    el.appendChild(badge);

    el.addEventListener('click', function(e) {
      const c = loadCounts();
      c[id] = (c[id] || 0) + 1;
      saveCounts(c);
      badge.textContent = c[id];
      this.classList.add('clicked');
      setTimeout(() => this.classList.remove('clicked'), 600);
    });
  };

  const primary = document.getElementById('translatedOption');
  const secondary = document.getElementById('originalOption');
  setupCard(primary);
  setupCard(secondary);
});

// ===== Navigation and Modal Functions =====

function openPaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.style.display = 'block';
    const status = document.getElementById('paymentStatus');
    if (status) status.style.display = 'none';
  }
}

function openAboutModal() {
  const modal = document.getElementById('aboutModal');
  if (modal) modal.style.display = 'block';
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(m => {
    m.style.display = 'none';
  });
}

// Handle payment
window.handlePayment = function(method) {
  const status = document.getElementById('paymentStatus');
  if (status) {
    status.style.display = 'block';
    status.className = 'success';
    status.textContent = `✅ Umefanikiwa kuchagua ${method}. Taarifa za malipo zimetumwa kwa simu yako.`;
    setTimeout(() => {
      closeModals();
    }, 3000);
  }
};

// Navigation click handlers
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && !href.startsWith('#')) {
      return;
    }
    e.preventDefault();
    const id = this.id;
    if (id === 'navPayment') {
      openPaymentModal();
    } else if (id === 'navAbout') {
      openAboutModal();
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

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModals();
  }
});

console.log('✅ TanzaFlix navigation system initialized');