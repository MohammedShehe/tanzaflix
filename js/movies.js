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
        <a href="movies.html?translated=0&category=Kiarabu" class="category-filter-link">Movies za Kiarabu</a>
        <a href="movies.html?translated=0&category=Kifilipino" class="category-filter-link">Movies za Kifilipino</a>
        <a href="movies.html?translated=0&category=Kihindi" class="category-filter-link">Movies za Kihindi</a>
        <a href="movies.html?translated=0&category=Bongo" class="category-filter-link">Bongo Movies</a>
        <a href="movies.html?translated=0&category=Kiitaliano" class="category-filter-link">Movies za Kiitaliano</a>
      </div>
    `;
  } else {
    categoryFilters.innerHTML = '';
  }

  // Sample movie data
  const movies = [
    { id: 1, title: 'Safari ya Mtaa', lang: 'Kiswahili', category: 'Bongo', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 2, title: 'The Silent Shore', lang: 'English', category: 'International', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 3, title: 'Mapenzi ya Mwanga', lang: 'Kiswahili', category: 'Bongo', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 4, title: 'Bollywood Dreams', lang: 'Hindi', category: 'Kihindi', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 5, title: 'Filipino Fiesta', lang: 'Filipino', category: 'Kifilipino', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 6, title: 'Arab Nights', lang: 'Arabic', category: 'Kiarabu', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ];

  // Filter movies based on category
  let filteredMovies = movies;
  if (category) {
    filteredMovies = movies.filter(m => m.category === category);
  }

  // Render movies
  if (!filteredMovies.length) {
    moviesList.innerHTML = '<p style="color:#d3d7ff; grid-column: 1/-1; text-align:center; padding:2rem;">Hakuna maudhui yaliyopatikana kwa sasa.</p>';
    return;
  }

  moviesList.innerHTML = filteredMovies.map(movie => `
    <article class="dash-card" data-id="${movie.id}">
      <p class="card-label">Filamu</p>
      <h2>${movie.title}</h2>
      <p>Lugha: ${movie.lang || 'Unknown'}</p>
      <p>Aina: ${movie.category || 'Mengine'}</p>
      <a href="watch.html?id=${movie.id}" class="category-filter-link" style="margin-top:0.75rem; display:inline-block;">
        Tazama sasa
      </a>
    </article>
  `).join('');
});