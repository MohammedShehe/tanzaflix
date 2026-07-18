(async function(){
  const params = new URLSearchParams(window.location.search);
  const translated = params.get('translated') === '1';
  const category = params.get('category');
  const moviesList = document.getElementById('moviesList');
  const categoryFilters = document.getElementById('categoryFilters');
  const title = document.getElementById('moviesTitle');

  if (translated) {
    title.textContent = 'Movies za Kihindi, Kizungu, Kiitaliano, Kifilipino na Bongo Movies';
  } else if (category) {
    title.textContent = `${category} za asili`;
  } else {
    title.textContent = 'Movies za asili / Michezo hazijatafsiriwa';
  }

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

  try {
    const queryString = `translated=${translated ? 1 : 0}` + (category ? `&category=${encodeURIComponent(category)}` : '');
    const res = await fetch(`http://localhost:5001/api/content?${queryString}`);
    const data = await res.json();
    const items = (data && data.items) || [];

    if (!items.length) {
      moviesList.innerHTML = '<p style="color:#d3d7ff">Hakuna maudhui yaliyopatikana kwa sasa.</p>';
      return;
    }

    moviesList.innerHTML = items.map(it => `
      <article class="dash-card" data-id="${it.id}">
        <p class="card-label">Filamu</p>
        <h2>${it.title}</h2>
        <p>Lugha: ${it.lang || 'Unknown'}</p>
        <p>Aina: ${it.category || 'Mengine'}</p>
        <a href="${it.videoUrl || '#'}" target="_blank" rel="noopener noreferrer" class="category-filter-link" style="margin-top:0.75rem; display:inline-block;">
          Tazama video ya mfano
        </a>
      </article>
    `).join('');
  } catch (e) {
    moviesList.innerHTML = '<p style="color:#fca5a5">Hitilafu ya kuwasiliana na server. Hakikisha backend inakimbia (http://localhost:5001).</p>';
    console.error(e);
  }
})();
