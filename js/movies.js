document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const translated = params.get('translated') === '1';
  const category = params.get('category');
  const moviesList = document.getElementById('moviesList');
  const categoryFilters = document.getElementById('categoryFilters');
  const title = document.getElementById('moviesTitle');

  // Set page title
  if (translated) {
    title.textContent = 'Movies za Kihindi, Kizungu, Kiitaliano, Kifilipino na Bongo Movies';
  } else if (category) {
    title.textContent = `${category} za asili`;
  } else {
    title.textContent = 'Movies za asili / Michezo hazijatafsiriwa';
  }

  // Render category filters for non-translated view
  if (!translated) {
    categoryFilters.innerHTML = `
      <div class="category-filter-header">
        <p class="category-hint">Chagua filamu hapa chini</p>
        <span class="category-arrow" aria-hidden="true">↓</span>
      </div>
      <div class="category-filter-chips">
        <a href="movies.html?translated=0&category=Kiarabu" class="category-filter-link ${category === 'Kiarabu' ? 'active' : ''}">Movies za Kiarabu</a>
        <a href="movies.html?translated=0&category=Kifilipino" class="category-filter-link ${category === 'Kifilipino' ? 'active' : ''}">Movies za Kifilipino</a>
        <a href="movies.html?translated=0&category=Kihindi" class="category-filter-link ${category === 'Kihindi' ? 'active' : ''}">Movies za Kihindi</a>
        <a href="movies.html?translated=0&category=Bongo" class="category-filter-link ${category === 'Bongo' ? 'active' : ''}">Bongo Movies</a>
        <a href="movies.html?translated=0&category=Kiitaliano" class="category-filter-link ${category === 'Kiitaliano' ? 'active' : ''}">Movies za Kiitaliano</a>
      </div>
    `;
  } else {
    categoryFilters.innerHTML = '';
  }

  // Movie data with poster images (SVG placeholders)
  const movies = [
    { 
      id: 1, 
      title: 'Safari ya Mtaa', 
      lang: 'Kiswahili', 
      category: 'Bongo', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225"><rect width="400" height="225" fill="%2311152d"/><rect y="0" width="400" height="4" fill="%236c63ff"/><text x="20" y="120" font-family="Arial" font-size="22" fill="%23f0f3ff" font-weight="bold">Safari ya Mtaa</text><text x="20" y="150" font-family="Arial" font-size="13" fill="%2394a3b8">Action • 2024 • Bongo</text><circle cx="350" cy="50" r="30" fill="%236c63ff" opacity="0.2"/><circle cx="30" cy="200" r="20" fill="%23ff4eb0" opacity="0.15"/></svg>'
    },
    { 
      id: 2, 
      title: 'The Silent Shore', 
      lang: 'English', 
      category: 'International', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225"><rect width="400" height="225" fill="%2311152d"/><rect y="0" width="400" height="4" fill="%2322d3ee"/><text x="20" y="120" font-family="Arial" font-size="20" fill="%23f0f3ff" font-weight="bold">The Silent Shore</text><text x="20" y="150" font-family="Arial" font-size="13" fill="%2394a3b8">Drama • 2023 • Intl</text><circle cx="350" cy="50" r="30" fill="%2322d3ee" opacity="0.2"/><circle cx="30" cy="200" r="20" fill="%23f97316" opacity="0.15"/></svg>'
    },
    { 
      id: 3, 
      title: 'Mapenzi ya Mwanga', 
      lang: 'Kiswahili', 
      category: 'Bongo', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225"><rect width="400" height="225" fill="%2311152d"/><rect y="0" width="400" height="4" fill="%23ec4899"/><text x="20" y="120" font-family="Arial" font-size="20" fill="%23f0f3ff" font-weight="bold">Mapenzi ya Mwanga</text><text x="20" y="150" font-family="Arial" font-size="13" fill="%2394a3b8">Romance • 2024 • Bongo</text><circle cx="350" cy="50" r="30" fill="%23ec4899" opacity="0.2"/><circle cx="30" cy="200" r="20" fill="%236c63ff" opacity="0.15"/></svg>'
    },
    { 
      id: 4, 
      title: 'Bollywood Dreams', 
      lang: 'Hindi', 
      category: 'Kihindi', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225"><rect width="400" height="225" fill="%2311152d"/><rect y="0" width="400" height="4" fill="%23f59e0b"/><text x="20" y="120" font-family="Arial" font-size="20" fill="%23f0f3ff" font-weight="bold">Bollywood Dreams</text><text x="20" y="150" font-family="Arial" font-size="13" fill="%2394a3b8">Musical • 2024 • Hindi</text><circle cx="350" cy="50" r="30" fill="%23f59e0b" opacity="0.2"/><circle cx="30" cy="200" r="20" fill="%23ec4899" opacity="0.15"/></svg>'
    },
    { 
      id: 5, 
      title: 'Filipino Fiesta', 
      lang: 'Filipino', 
      category: 'Kifilipino', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225"><rect width="400" height="225" fill="%2311152d"/><rect y="0" width="400" height="4" fill="%2314b8a6"/><text x="20" y="120" font-family="Arial" font-size="20" fill="%23f0f3ff" font-weight="bold">Filipino Fiesta</text><text x="20" y="150" font-family="Arial" font-size="13" fill="%2394a3b8">Comedy • 2023 • Filipino</text><circle cx="350" cy="50" r="30" fill="%2314b8a6" opacity="0.2"/><circle cx="30" cy="200" r="20" fill="%23f97316" opacity="0.15"/></svg>'
    },
    { 
      id: 6, 
      title: 'Arab Nights', 
      lang: 'Arabic', 
      category: 'Kiarabu', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225"><rect width="400" height="225" fill="%2311152d"/><rect y="0" width="400" height="4" fill="%23f97316"/><text x="20" y="120" font-family="Arial" font-size="20" fill="%23f0f3ff" font-weight="bold">Arab Nights</text><text x="20" y="150" font-family="Arial" font-size="13" fill="%2394a3b8">Thriller • 2024 • Arabic</text><circle cx="350" cy="50" r="30" fill="%23f97316" opacity="0.2"/><circle cx="30" cy="200" r="20" fill="%23ec4899" opacity="0.15"/></svg>'
    }
  ];

  // Filter movies based on category
  let filteredMovies = movies;
  if (category) {
    filteredMovies = movies.filter(m => m.category === category);
  }

  // Render movies with clickable cards
  if (!filteredMovies.length) {
    moviesList.innerHTML = '<div class="empty-state">Hakuna maudhui yaliyopatikana kwa sasa.</div>';
    return;
  }

  moviesList.innerHTML = filteredMovies.map(movie => `
    <article class="movie-card" data-id="${movie.id}" data-url="watch.html?id=${movie.id}">
      <div class="movie-poster">
        <img src="${movie.poster}" alt="${movie.title} poster" loading="lazy" />
        <div class="play-overlay">
          <span>▶ Tazama</span>
        </div>
      </div>
      <p class="card-label">Filamu</p>
      <h2>${movie.title}</h2>
      <div class="movie-meta">
        <span class="lang-tag">${movie.lang || 'Unknown'}</span>
        <span class="category-tag">${movie.category || 'Mengine'}</span>
      </div>
      <a href="watch.html?id=${movie.id}" class="watch-btn">
        Tazama sasa
      </a>
    </article>
  `).join('');

  // Add click event to entire card for better UX
  document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', function(e) {
      // Don't navigate if click is on the button (it already has its own link)
      if (e.target.closest('.watch-btn')) {
        return;
      }
      const url = this.dataset.url;
      if (url) {
        window.location.href = url;
      }
    });
  });
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

// Navigation click handlers
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

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModals();
  }
});

console.log('✅ TanzaFlix movies page navigation initialized');