(async function () {
  const params = new URLSearchParams(window.location.search);
  const translated = params.get('translated') === '1';
  const category = params.get('category');
  const moviesList = document.getElementById('moviesList');
  const categoryFilters = document.getElementById('categoryFilters');
  const title = document.getElementById('moviesTitle');

  if (translated) {
    title.textContent = 'Movies za Kihindi, Kizungu, Kiitaliano, Kifilipino na Bongo Movies';
  } else if (category) {
    title.textContent = `Movies za ${category} za Asili`;
  } else {
    title.textContent = 'Movies za Asili / Michezo Hazijatafsiriwa';
  }

  if (!translated) {
    categoryFilters.innerHTML = `
      <div class="category-filter-header">
        <p class="category-hint">Chagua kundi la filamu hapa chini</p>
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
    const res = await fetch(`/api/content?${queryString}`);
    const data = await res.json();
    const items = (data && data.items) || [];

    if (!items.length) {
      moviesList.innerHTML = '<p style="color:#d3d7ff; text-align:center; font-size:1.05rem;">Hakuna maudhui yaliyopatikana kwa sasa kwenye kundi hili.</p>';
      return;
    }

    moviesList.innerHTML = items.map((it) => {
      const poster = it.poster_url || it.posterUrl || 'img/default-poster.svg';
      const videoUrl = it.video_url || it.videoUrl || '';
      const categoryName = it.category || 'Asili';
      const titleText = it.title || 'Filamu';

      return `
        <article class="dash-card" data-id="${it.id}" style="position:relative; overflow:hidden; border-radius:12px; background:#11152d; box-shadow:0 10px 24px rgba(0,0,0,.25);">
          <div style="width:100%; height:200px; background: linear-gradient(135deg, #4f46e5, #2563eb); display:flex; align-items:center; justify-content:center;">
            <img src="${poster}" alt="${titleText}" style="width:100%; height:100%; object-fit:cover;" />
          </div>
          <div style="padding:15px;">
            <p class="card-label" style="font-size:0.8rem; color:#a5b4fc; text-transform:uppercase; margin-bottom:6px;">Filamu | ${categoryName}</p>
            <h2 style="font-size:1.12rem; margin:0 0 8px 0; color:#fff;">${titleText}</h2>
            <p style="font-size:0.92rem; color:#94a3b8; margin-bottom:14px;">Lugha: ${it.lang || 'Unknown'}</p>
            <a href="watch.html?id=${it.id}" class="btn-watch" style="display:block; text-align:center; background:#4f46e5; color:#fff; padding:10px 12px; border-radius:6px; text-decoration:none; font-weight:700; transition:background 0.2s;">
              Tazama Sasa
            </a>
          </div>
        </article>
      `;
    }).join('');
  } catch (e) {
    moviesList.innerHTML = '<p style="color:#fca5a5">Hitilafu ya kuwasiliana na server. Hakikisha backend inakimbia na jaribu tena.</p>';
    console.error(e);
  }
})();
