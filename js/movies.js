// js/movies.js - Movies Page with Ratings

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!auth.checkAuth()) return;

    const params = new URLSearchParams(window.location.search);
    const translated = params.get('translated') === '1';
    const moviesList = document.getElementById('moviesList');
    const categoryFilters = document.getElementById('categoryFilters');

    // Set title based on translation preference
    document.getElementById('moviesTitle').textContent = translated 
        ? 'Michezo / Movies zilizotafsiriwa' 
        : 'Michezo / Movies hazijatafsiriwa';

    // ===== Category Filters =====
    const categories = [
        { id: 'all', label: 'Zote' },
        { id: 'Action', label: 'Action' },
        { id: 'Love story', label: 'Love Story' },
        { id: 'Drama', label: 'Drama' },
        { id: 'Mix', label: 'Mix' }
    ];

    categoryFilters.innerHTML = `
        <div class="category-filter-header">
            <span class="category-hint">Chagua Kategoria</span>
            <span class="category-arrow">↓</span>
        </div>
        <div class="category-filter-chips" id="categoryChips">
            ${categories.map(cat => `
                <a href="#" class="category-filter-link ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
                    ${cat.label}
                </a>
            `).join('')}
        </div>
    `;

    // ===== Load Movies =====
    let moviesData = [];
    let selectedCategory = 'all';

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
                moviesData = response.movies;
                filterAndRenderMovies();
            } else {
                throw new Error(response.message || 'Failed to load movies');
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            moviesList.innerHTML = `
                <div class="empty-state">
                    <p style="color:#f87171;">❌ Error loading movies: ${error.message}</p>
                    <p style="color:#9aa2d7;margin-top:1rem;">Tafadhasi jaribu tena baadaye.</p>
                </div>
            `;
        }
    }

    function filterAndRenderMovies() {
        const filtered = selectedCategory === 'all' 
            ? moviesData 
            : moviesData.filter(m => m.category === selectedCategory);

        if (filtered.length === 0) {
            moviesList.innerHTML = `
                <div class="empty-state">
                    <p style="color:#9aa2d7;">Hakuna movies katika kategoria hii</p>
                </div>
            `;
            return;
        }

        moviesList.innerHTML = filtered.map(movie => {
            const typeBadge = movie.movie_type === 'series' 
                ? '<span class="type-badge series">📺 Series</span>' 
                : '<span class="type-badge single">🎬 Single</span>';
            
            // Rating display
            const avgRating = movie.rating?.average || 0;
            const totalRatings = movie.rating?.total || 0;
            const ratingDisplay = totalRatings > 0 
                ? `<span style="color:#fbbf24;">★</span> ${avgRating.toFixed(1)} (${totalRatings})` 
                : '⭐ Hakuna rating';

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
                    <div class="card-label">${typeBadge}</div>
                    <h2>${movie.title}</h2>
                    <div class="movie-meta">
                        <span>${movie.year || 'N/A'}</span>
                        <span class="lang-tag">${movie.language || 'N/A'}</span>
                        <span class="category-tag">${movie.category || 'N/A'}</span>
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

    // ===== Category Filter Click Handlers =====
    document.getElementById('categoryChips').addEventListener('click', function(e) {
        const link = e.target.closest('.category-filter-link');
        if (!link) return;
        e.preventDefault();

        document.querySelectorAll('.category-filter-link').forEach(el => el.classList.remove('active'));
        link.classList.add('active');

        selectedCategory = link.dataset.category;
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

// ===== Navigation click handlers - FIXED =====
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const id = this.id;
        
        // Handle About modal
        if (id === 'navAbout') {
            e.preventDefault();
            openAboutModal();
            return;
        }
        
        // Handle Payment/Subscription
        if (id === 'navPayment') {
            e.preventDefault();
            window.location.href = 'subscription.html';
            return;
        }
        
        // Handle Ratings - Navigate to admin.html with ratings tab
        if (id === 'navRatings' || this.textContent.trim() === 'Ratings') {
            e.preventDefault();
            window.location.href = 'admin.html?tab=ratings';
            return;
        }
        
        // Handle navigation links with actual href
        if (href && !href.startsWith('#') && href !== '#' && href !== '') {
            // Allow normal navigation
            return;
        }
        
        // Prevent default for empty or # links
        if (href === '#' || href === '' || href === null) {
            e.preventDefault();
        }
    });
});

// ===== Also handle Ratings link specifically =====
// Find the Ratings nav link by its text content or id
const ratingsLink = document.querySelector('.nav-link#navRatings') || 
                    document.querySelector('.nav-link:not(#navAbout):not(#navPayment)')?.textContent?.trim() === 'Ratings' ? 
                    document.querySelector('.nav-link:not(#navAbout):not(#navPayment)') : null;

if (ratingsLink) {
    ratingsLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'admin.html?tab=ratings';
    });
}

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

console.log('🎬 TanzaFlix Movies page loaded');