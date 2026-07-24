// js/movies.js - Movies Page with Country Filtering

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!auth.checkAuth()) return;

    const params = new URLSearchParams(window.location.search);
    const translated = params.get('translated') === '1';
    const moviesList = document.getElementById('moviesList');
    const countryFilters = document.getElementById('countryFilters');

    // Set title based on translation preference
    document.getElementById('moviesTitle').textContent = translated 
        ? 'Michezo / Movies zilizotafsiriwa' 
        : 'Michezo / Movies hazijatafsiriwa';

    // ===== Country Filters =====
    // Exact country names matching backend enum
    const countries = [
        { id: 'all', label: 'Zote' },
        { id: 'Movie ya Kiengereza', label: 'Movie ya Kiengereza' },
        { id: 'Bongo Movie', label: 'Bongo Movie' },
        { id: 'Movie ya Kiarabu', label: 'Movie ya Kiarabu' },
        { id: 'Movie ya Kifilipino', label: 'Movie ya Kifilipino' },
        { id: 'Movie ya Kihindi', label: 'Movie ya Kihindi' },
        { id: 'Movie ya Kitaliano', label: 'Movie ya Kitaliano' },
        { id: 'Movie ya Kikorea', label: 'Movie ya Kikorea' }
    ];

    countryFilters.innerHTML = `
        <div class="country-filter-header">
            <span class="country-hint">🌍 Chagua Nchi</span>
            <span class="country-arrow">↓</span>
        </div>
        <div class="country-filter-chips" id="countryChips">
            ${countries.map(c => `
                <a href="#" class="country-filter-link ${c.id === 'all' ? 'active' : ''}" data-country="${c.id}">
                    ${c.label}
                </a>
            `).join('')}
        </div>
    `;

    // ===== Load Movies =====
    let moviesData = [];
    let selectedCountry = 'all';

    async function loadMovies() {
        try {
            moviesList.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#9aa2d7;">
                    <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
                    Inapakia movies...
                </div>
            `;

            const response = await api.getUserMovies();
            
            if (response.success && response.movies) {
                // ===== FILTER BY TRANSLATION STATUS =====
                let filteredMovies = response.movies;
                
                if (translated) {
                    filteredMovies = response.movies.filter(m => m.is_translated === true || m.is_translated === 1);
                } else {
                    filteredMovies = response.movies.filter(m => m.is_translated === false || m.is_translated === 0);
                }
                
                moviesData = filteredMovies;
                filterAndRenderMovies();
            } else {
                throw new Error(response.message || 'Failed to load movies');
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            moviesList.innerHTML = `
                <div class="empty-state">
                    <p style="color:#f87171;">❌ Error loading movies: ${error.message}</p>
                    <p style="color:#9aa2d7;margin-top:1rem;">Tafadhali jaribu tena baadaye.</p>
                </div>
            `;
        }
    }

    function filterAndRenderMovies() {
        // Filter by country (using exact country name as stored in DB)
        let filtered = selectedCountry === 'all' 
            ? moviesData 
            : moviesData.filter(m => m.country === selectedCountry);

        if (filtered.length === 0) {
            const message = translated 
                ? 'Hakuna movies zilizotafsiriwa kutoka nchi hii' 
                : 'Hakuna movies hazijatafsiriwa kutoka nchi hii';
            moviesList.innerHTML = `
                <div class="empty-state">
                    <p style="color:#9aa2d7;">${message}</p>
                </div>
            `;
            return;
        }

        moviesList.innerHTML = filtered.map(movie => {
            const typeBadge = movie.movie_type === 'series' 
                ? '<span class="type-badge series">📺 Series</span>' 
                : '<span class="type-badge single">🎬 Single</span>';
            
            // Translation badge
            const translationBadge = movie.is_translated 
                ? '<span class="translation-badge translated">✅ Imetafsiriwa</span>'
                : '<span class="translation-badge original">📝 Asili</span>';
            
            // Rating display
            const avgRating = movie.rating?.average || 0;
            const totalRatings = movie.rating?.total || 0;
            const ratingDisplay = totalRatings > 0 
                ? `<span style="color:#fbbf24;">★</span> ${avgRating.toFixed(1)} (${totalRatings})` 
                : '⭐ Hakuna rating';

            // Country display - use exact country name from backend
            const countryDisplay = movie.country || 'N/A';

            return `
                <div class="movie-card" data-id="${movie.id}">
                    <div class="movie-poster">
                        ${movie.poster 
                            ? `<img src="${movie.poster}" alt="${movie.title}" loading="lazy" />` 
                            : `<div style="padding:2rem;text-align:center;color:#6b7280;">🎬 No Poster</div>`
                        }
                        <div class="play-overlay">
                            <span>▶ Tazama</span>
                        </div>
                    </div>
                    <div class="card-label">
                        ${typeBadge}
                        ${translationBadge}
                    </div>
                    <h2>${movie.title}</h2>
                    <div class="movie-meta">
                        <span>${movie.year || 'N/A'}</span>
                        <span class="lang-tag">${movie.language || 'N/A'}</span>
                        <span class="country-tag">${countryDisplay}</span>
                    </div>
                    <div style="margin: 0.3rem 0 0.5rem; font-size:0.85rem; color:#b8c4ff;">
                        ${ratingDisplay}
                    </div>
                    <button class="watch-btn" data-id="${movie.id}">Tazama Sasa</button>
                </div>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.movie-card .watch-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                window.location.href = `watch.html?id=${id}`;
            });
        });

        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', function() {
                const id = this.dataset.id;
                window.location.href = `watch.html?id=${id}`;
            });
        });
    }

    // ===== Country Filter Click Handlers =====
    document.getElementById('countryChips').addEventListener('click', function(e) {
        const link = e.target.closest('.country-filter-link');
        if (!link) return;
        e.preventDefault();

        document.querySelectorAll('.country-filter-link').forEach(el => el.classList.remove('active'));
        link.classList.add('active');

        selectedCountry = link.dataset.country;
        filterAndRenderMovies();
    });

    // ===== Load Movies =====
    await loadMovies();
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

// ===== Navigation click handlers =====
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const id = this.id;
        
        if (id === 'navAbout') {
            e.preventDefault();
            openAboutModal();
            return;
        }
        
        if (id === 'navPayment') {
            e.preventDefault();
            window.location.href = 'subscription.html';
            return;
        }
        
        if (href && !href.startsWith('#') && href !== '#' && href !== '') {
            return;
        }
        
        if (href === '#' || href === '' || href === null) {
            e.preventDefault();
        }
    });
});

// ===== Modal close handlers =====
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

