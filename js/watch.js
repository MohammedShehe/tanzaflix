// js/watch.js - Watch Page with Rating, Country Filter, and Real-Time Video Tracking

import api from './api.js';
import auth from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!auth.checkAuth()) return;

    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    if (!movieId) {
        window.location.href = 'movies.html';
        return;
    }

    // DOM Elements
    const video = document.getElementById('watchVideo');
    const source = document.getElementById('watchSource');
    const titleEl = document.getElementById('watchTitle');
    const descEl = document.getElementById('watchDescription');
    const playBtn = document.getElementById('playBtn');
    const seriesNav = document.getElementById('seriesNav');
    const seasonSelector = document.getElementById('seasonSelector');
    const episodeGrid = document.getElementById('episodeGrid');
    const episodeCurrentLabel = document.getElementById('episodeCurrentLabel');
    const typeBadge = document.getElementById('watchTypeBadge');
    const paywallOverlay = document.getElementById('paywallOverlay');
    const buyMovieBtn = document.getElementById('buyMovieBtn');
    const watchYear = document.getElementById('watchYear');
    const watchGenre = document.getElementById('watchGenre');
    const watchRuntime = document.getElementById('watchRuntime');
    const watchLang = document.getElementById('watchLang');
    const watchCountry = document.getElementById('watchCountry');
    const streamingBadge = document.getElementById('streamingBadge');
    const accessBadge = document.getElementById('accessBadge');
    const ratingText = document.getElementById('ratingText');

    let movieData = null;
    let currentSeason = 1;
    let currentEpisode = 0;
    let isSeries = false;
    let canWatch = false;
    let accessType = null;
    let isFirstTime = false;
    
    // Real-time tracking variables
    let lastProgressUpdate = 0;
    const PROGRESS_INTERVAL = 5;
    let isTrackingEnabled = false;
    let currentEpisodeId = null;
    let totalDuration = 0;
    let hasMarkedComplete = false;

    // Show loading state
    titleEl.textContent = 'Inapakia...';

    // Country Display Map
    const countryMap = {
        'Bongo Movie': '🇹🇿 Bongo',
        'Movie ya Kiarabu': '🇸🇦 Kiarabu',
        'Movie ya Kifilipino': '🇵🇭 Kifilipino',
        'Movie ya Kihindi': '🇮🇳 Kihindi',
        'Movie ya Kitaliano': '🇮🇹 Kitaliano',
        'Movie ya Kikorea': '🇰🇷 Kikorea'
    };

    // ===== Rating Modal =====
    const ratingModal = document.createElement('div');
    ratingModal.id = 'ratingModal';
    ratingModal.className = 'modal';
    ratingModal.style.display = 'none';
    ratingModal.innerHTML = `
        <div class="modal-content" style="max-width:480px;">
            <div class="modal-header">
                <h3 id="ratingModalTitle">Kadiria Movie</h3>
                <button class="modal-close rating-modal-close">&times;</button>
            </div>
            <form id="ratingForm">
                <input type="hidden" id="ratingMovieId" value="${movieId}" />
                <div class="form-group" style="margin-bottom:1.2rem;">
                    <label style="display:block;font-size:0.85rem;font-weight:600;color:#9aa2d7;margin-bottom:0.5rem;">
                        Kadiria (1 - 10)
                    </label>
                    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;" id="ratingStars">
                        ${[1,2,3,4,5,6,7,8,9,10].map(r => `
                            <button type="button" class="rating-star" data-value="${r}" style="
                                width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,0.1);
                                background:transparent;color:#9aa2d7;font-weight:700;font-size:0.9rem;
                                cursor:pointer;transition:all 0.2s ease;
                            ">${r}</button>
                        `).join('')}
                    </div>
                    <div id="ratingSelectedDisplay" style="margin-top:0.5rem;color:#c7d2fe;font-size:0.9rem;">
                        Hakuna rating iliyochaguliwa
                    </div>
                </div>
                <div class="form-group">
                    <label style="display:block;font-size:0.85rem;font-weight:600;color:#9aa2d7;margin-bottom:0.4rem;">
                        Maoni (hiari)
                    </label>
                    <textarea id="ratingReview" rows="3" placeholder="Andika maoni yako kuhusu movie hii..." style="
                        width:100%;padding:0.7rem 1rem;background:rgba(255,255,255,0.05);
                        border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#f5f7ff;
                        font-family:inherit;font-size:0.9rem;resize:vertical;
                    "></textarea>
                </div>
                <div id="ratingMessage" style="display:none;padding:0.8rem;border-radius:12px;margin:1rem 0;text-align:center;"></div>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel rating-modal-close">Ghairi</button>
                    <button type="submit" class="btn-submit" id="submitRatingBtn">Tuma Rating</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(ratingModal);

    // Rating Modal Functions
    let selectedRating = 0;
    let userHasRated = false;
    let userRatingData = null;

    function openRatingModal() {
        const modal = document.getElementById('ratingModal');
        if (!modal) return;
        
        selectedRating = 0;
        document.getElementById('ratingReview').value = '';
        document.getElementById('ratingSelectedDisplay').textContent = 'Hakuna rating iliyochaguliwa';
        document.querySelectorAll('.rating-star').forEach(el => {
            el.style.background = 'transparent';
            el.style.borderColor = 'rgba(255,255,255,0.1)';
            el.style.color = '#9aa2d7';
        });
        document.getElementById('ratingMessage').style.display = 'none';
        document.getElementById('submitRatingBtn').disabled = false;
        document.getElementById('submitRatingBtn').textContent = 'Tuma Rating';

        if (userHasRated && userRatingData) {
            document.getElementById('ratingModalTitle').textContent = 'Rating Yako';
            document.getElementById('ratingSelectedDisplay').textContent = `Rating yako: ${userRatingData.rating}/10`;
            document.querySelectorAll('.rating-star').forEach(el => {
                const val = parseInt(el.dataset.value);
                if (val <= userRatingData.rating) {
                    el.style.background = 'rgba(108,99,255,0.3)';
                    el.style.borderColor = '#6c63ff';
                    el.style.color = '#fff';
                }
            });
            document.getElementById('submitRatingBtn').textContent = '✅ Tayari Umerate';
            document.getElementById('submitRatingBtn').disabled = true;
            if (userRatingData.review_text) {
                document.getElementById('ratingReview').value = userRatingData.review_text;
            }
        } else {
            document.getElementById('ratingModalTitle').textContent = `Kadiria: ${movieData?.title || 'Movie'}`;
        }

        modal.style.display = 'flex';
    }

    function closeRatingModal() {
        const modal = document.getElementById('ratingModal');
        if (modal) modal.style.display = 'none';
    }

    document.querySelectorAll('.rating-star').forEach(el => {
        el.addEventListener('click', function() {
            if (userHasRated) return;
            
            const value = parseInt(this.dataset.value);
            selectedRating = value;
            
            document.querySelectorAll('.rating-star').forEach(star => {
                const starVal = parseInt(star.dataset.value);
                if (starVal <= value) {
                    star.style.background = 'rgba(108,99,255,0.3)';
                    star.style.borderColor = '#6c63ff';
                    star.style.color = '#fff';
                } else {
                    star.style.background = 'transparent';
                    star.style.borderColor = 'rgba(255,255,255,0.1)';
                    star.style.color = '#9aa2d7';
                }
            });
            
            document.getElementById('ratingSelectedDisplay').textContent = `Rating: ${value}/10`;
        });
    });

    document.getElementById('ratingForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (userHasRated) {
            closeRatingModal();
            return;
        }

        const movieId = document.getElementById('ratingMovieId').value;
        const review = document.getElementById('ratingReview').value.trim();
        const messageEl = document.getElementById('ratingMessage');

        if (!selectedRating || selectedRating < 1 || selectedRating > 10) {
            messageEl.style.display = 'block';
            messageEl.style.background = 'rgba(239,68,68,0.1)';
            messageEl.style.border = '1px solid rgba(239,68,68,0.2)';
            messageEl.style.color = '#f87171';
            messageEl.textContent = '⚠️ Tafadhali chagua rating kati ya 1 na 10.';
            return;
        }

        document.getElementById('submitRatingBtn').disabled = true;
        document.getElementById('submitRatingBtn').textContent = '⏳ Inatuma...';

        try {
            const response = await api.rateMovie(movieId, selectedRating, review || null);
            
            if (response.success) {
                messageEl.style.display = 'block';
                messageEl.style.background = 'rgba(34,197,94,0.1)';
                messageEl.style.border = '1px solid rgba(34,197,94,0.2)';
                messageEl.style.color = '#4ade80';
                messageEl.textContent = '✅ Rating imetumwa kwa mafanikio!';
                
                userHasRated = true;
                userRatingData = {
                    rating: selectedRating,
                    review_text: review || null
                };
                
                updateRatingDisplay();
                
                document.getElementById('submitRatingBtn').textContent = '✅ Imefanikiwa';
                document.getElementById('submitRatingBtn').disabled = true;
                
                setTimeout(() => {
                    closeRatingModal();
                }, 1500);
            } else {
                throw new Error(response.message || 'Rating failed');
            }
        } catch (error) {
            console.error('Rating error:', error);
            messageEl.style.display = 'block';
            messageEl.style.background = 'rgba(239,68,68,0.1)';
            messageEl.style.border = '1px solid rgba(239,68,68,0.2)';
            messageEl.style.color = '#f87171';
            messageEl.textContent = `❌ ${error.message || 'Tumeshindwa kutuma rating. Tafadhali jaribu tena.'}`;
            document.getElementById('submitRatingBtn').disabled = false;
            document.getElementById('submitRatingBtn').textContent = 'Tuma Rating';
        }
    });

    document.querySelectorAll('.rating-modal-close').forEach(btn => {
        btn.addEventListener('click', closeRatingModal);
    });

    function updateRatingDisplay() {
        if (movieData?.rating) {
            const avg = movieData.rating.average || 0;
            const total = movieData.rating.total || 0;
            const percentage = avg > 0 ? (avg / 10) * 100 : 0;
            
            const ratingBar = document.querySelector('.rating-fill');
            if (ratingBar) {
                ratingBar.style.width = `${Math.min(percentage, 100)}%`;
            }
            
            const userRatingText = userHasRated ? ` • Rating yako: ${userRatingData?.rating}/10` : '';
            ratingText.innerHTML = `<strong>${avg.toFixed(1)}</strong> / 10 ★ (${total} ratings)${userRatingText}`;
        }
    }

    function formatRuntime(minutes) {
        if (!minutes || minutes <= 0) {
            return 'N/A';
        }
        
        if (typeof minutes === 'string' && (minutes.includes('h') || minutes.includes('m'))) {
            return minutes;
        }
        
        const mins = parseInt(minutes);
        if (isNaN(mins)) return 'N/A';
        
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        
        if (hours > 0 && remainingMins > 0) {
            return `${hours}h ${remainingMins}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${remainingMins}m`;
        }
    }

    // ===== Real-Time Video Tracking =====
    
    async function trackProgress(currentTime, duration) {
        if (!isTrackingEnabled || hasMarkedComplete) return;
        
        try {
            if (!isSeries) {
                await api.markMovieComplete(
                    movieId,
                    Math.floor(currentTime),
                    Math.floor(duration)
                );
            } else {
                if (currentEpisodeId) {
                    await api.markEpisodeComplete(
                        movieId,
                        currentEpisodeId,
                        Math.floor(currentTime),
                        Math.floor(duration)
                    );
                }
            }
        } catch (error) {
            // Silently handle tracking errors
        }
    }

    async function markComplete() {
        if (hasMarkedComplete) return;
        hasMarkedComplete = true;
        
        try {
            const duration = Math.floor(video.duration);
            await trackProgress(duration, duration);
            
            setTimeout(() => {
                if (confirm('✅ Umaliza kutazama! Je, ungependa kuikadiria movie hii?')) {
                    openRatingModal();
                }
            }, 2000);
            
        } catch (error) {
            // Silently handle completion errors
        }
    }

    async function saveFinalProgress() {
        try {
            const currentTime = Math.floor(video.currentTime);
            const duration = Math.floor(video.duration);
            
            if (currentTime > 0 && currentTime < duration && !hasMarkedComplete) {
                await trackProgress(currentTime, duration);
            }
        } catch (error) {
            // Silently handle save errors
        }
    }

    // ===== Video Event Listeners =====
    
    video.addEventListener('timeupdate', function() {
        const currentTime = this.currentTime;
        const duration = this.duration;
        
        if (!duration || isNaN(duration) || duration === 0) return;
        
        totalDuration = duration;
        
        if (currentTime - lastProgressUpdate >= PROGRESS_INTERVAL && currentTime > 0) {
            lastProgressUpdate = currentTime;
            trackProgress(currentTime, duration);
        }
    });

    video.addEventListener('ended', function() {
        markComplete();
        
        if (isSeries && movieData?.seasons) {
            const season = movieData.seasons.find(s => s.season_number === currentSeason);
            if (season?.episodes && currentEpisode < season.episodes.length - 1) {
                setTimeout(() => {
                    currentEpisode++;
                    renderSeriesNav(movieData.seasons);
                    loadEpisode(movieData.seasons, currentSeason, currentEpisode);
                }, 3000);
            }
        }
    });

    video.addEventListener('play', function() {
        isTrackingEnabled = true;
    });

    video.addEventListener('pause', function() {
        if (isTrackingEnabled && !hasMarkedComplete) {
            const currentTime = this.currentTime;
            const duration = this.duration;
            if (currentTime > 0 && duration > 0) {
                trackProgress(currentTime, duration);
            }
        }
    });

    video.addEventListener('loadedmetadata', function() {
        const duration = Math.floor(this.duration);
        if (duration > 0) {
            watchRuntime.textContent = formatRuntime(duration);
        }
    });

    window.addEventListener('beforeunload', function() {
        saveFinalProgress();
    });

    // ===== Load Movie Data =====
    try {
        const response = await api.getUserMovie(movieId);
        
        if (!response.success || !response.movie) {
            throw new Error(response.message || 'Movie not found');
        }

        movieData = response.movie;
        canWatch = movieData.canWatch || false;
        accessType = movieData.accessType || null;
        isSeries = movieData.movie_type === 'series';
        isFirstTime = movieData.isFirstTime || false;

        if (movieData.rating) {
            userHasRated = movieData.rating.user_has_rated || false;
            userRatingData = movieData.rating.user_rating || null;
        }

        // Populate UI
        titleEl.textContent = movieData.title || 'Filamu';
        descEl.textContent = movieData.description || 'Mchezo wa kuvutia wenye hadithi kali.';
        watchYear.textContent = movieData.year || '2024';
        watchGenre.textContent = movieData.category || 'Action';
        
        const runtimeDisplay = formatRuntime(movieData.movie_time);
        watchRuntime.textContent = runtimeDisplay;
        
        watchLang.textContent = movieData.language || 'Kiswahili';
        watchCountry.textContent = countryMap[movieData.country] || movieData.country || 'N/A';

        if (isSeries) {
            typeBadge.textContent = '📺 Series';
            typeBadge.className = 'type-badge-watch series';
        } else {
            typeBadge.textContent = '🎬 Single Movie';
            typeBadge.className = 'type-badge-watch single';
        }

        if (canWatch) {
            streamingBadge.style.display = 'inline-flex';
            accessBadge.style.display = 'none';
            
            if (accessType === 'subscription') {
                streamingBadge.textContent = '▶ Premium Streaming';
            } else if (accessType === 'free_trial') {
                streamingBadge.textContent = '✅ Free Trial - First Time Watching';
            } else if (accessType === 'paid_single') {
                streamingBadge.textContent = '▶ Premium Streaming';
            } else {
                streamingBadge.textContent = '▶ Premium Streaming';
            }
        } else {
            streamingBadge.style.display = 'none';
            accessBadge.style.display = 'none';
        }

        if (movieData.poster) {
            video.poster = movieData.poster;
        }

        updateRatingDisplay();

        if (!canWatch) {
            paywallOverlay.style.display = 'flex';
            seriesNav.style.display = 'none';
            
            if (movieData.price) {
                buyMovieBtn.textContent = `💳 Nunua - TSh ${movieData.price}`;
            }
            
            const paywallMessage = document.querySelector('.paywall-box p');
            if (accessType === 'trial_used') {
                paywallMessage.textContent = 'Umeshatazama filamu/kipindi chako cha bure. Nunua filamu hii au jisajili ili uendelee kutazama filamu na mfululizo bila kikomo.';
            } else if (accessType === 'denied') {
                paywallMessage.textContent = 'Unahitaji kujiandikisha au kununua filamu hii ili kuendelea kutazama. Jisajili sasa na upate ufikiaji wa filamu zote!';
            }
            
            if (movieData.more_like_this && movieData.more_like_this.length > 0) {
                renderRecommendations(movieData.more_like_this);
            }
            return;
        }

        if (!isSeries) {
            if (movieData.video) {
                source.src = movieData.video;
                video.load();
            }
            seriesNav.style.display = 'none';
        } else {
            if (movieData.seasons && movieData.seasons.length > 0) {
                seriesNav.style.display = 'block';
                renderSeriesNav(movieData.seasons);
                
                const firstSeason = movieData.seasons[0];
                if (firstSeason && firstSeason.episodes && firstSeason.episodes.length > 0) {
                    currentSeason = firstSeason.season_number || 1;
                    currentEpisode = 0;
                    loadEpisode(movieData.seasons, currentSeason, currentEpisode);
                }
            } else {
                seriesNav.style.display = 'none';
            }
        }

        if (movieData.accessMessage) {
            const msgEl = document.createElement('div');
            msgEl.style.cssText = `
                padding: 0.75rem 1rem;
                border-radius: 12px;
                background: rgba(34,197,94,0.1);
                border: 1px solid rgba(34,197,94,0.2);
                color: #4ade80;
                margin-bottom: 1rem;
                font-weight: 500;
            `;
            msgEl.textContent = `✅ ${movieData.accessMessage}`;
            const movieInfo = document.querySelector('.movie-info');
            const existingMsg = movieInfo.querySelector('.access-message');
            if (existingMsg) existingMsg.remove();
            msgEl.className = 'access-message';
            movieInfo.prepend(msgEl);
        }

        if (movieData.more_like_this && movieData.more_like_this.length > 0) {
            renderRecommendations(movieData.more_like_this);
        }

    } catch (error) {
        console.error('Error loading movie:', error);
        document.querySelector('.movie-info').innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--watch-muted);">
                <p style="font-size:1.2rem;color:#f87171;">Error loading movie</p>
                <p>${error.message}</p>
                <a href="movies.html" style="color:#6c63ff;text-decoration:none;font-weight:600;">← Rudi kwenye Movies</a>
            </div>
        `;
    }

    function renderRecommendations(moreLikeThis) {
        const recRow = document.getElementById('recommendationRow');
        recRow.innerHTML = moreLikeThis.map(rec => {
            const recRuntime = formatRuntime(rec.movie_time);
            
            return `
                <div class="rec-card" data-id="${rec.id}">
                    <span class="rec-category">${rec.category || 'Filamu'}</span>
                    <strong>${rec.title}</strong>
                    <span class="rec-meta">${recRuntime}</span>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.rec-card').forEach(card => {
            card.addEventListener('click', function() {
                window.location.href = `watch.html?id=${this.dataset.id}`;
            });
        });
    }

    function renderSeriesNav(seasons) {
        if (!seasons || seasons.length === 0) return;

        seasonSelector.innerHTML = seasons.map(season => {
            const isActive = season.season_number === currentSeason;
            return `<button class="season-btn ${isActive ? 'active' : ''}" data-season="${season.season_number}">S${String(season.season_number).padStart(2, '0')}</button>`;
        }).join('');

        renderEpisodes(seasons, currentSeason);

        document.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const season = parseInt(this.dataset.season);
                currentSeason = season;
                currentEpisode = 0;
                hasMarkedComplete = false;
                renderSeriesNav(seasons);
                loadEpisode(seasons, season, 0);
            });
        });
    }

    function renderEpisodes(seasons, seasonNumber) {
        const season = seasons.find(s => s.season_number === seasonNumber);
        if (!season || !season.episodes) {
            episodeGrid.innerHTML = '<p style="color: var(--watch-muted);">No episodes available.</p>';
            return;
        }

        episodeGrid.innerHTML = season.episodes.map((ep, index) => {
            const isActive = index === currentEpisode;
            const epDuration = formatRuntime(ep.duration);
            
            return `
                <button class="episode-btn ${isActive ? 'active' : ''}" data-season="${seasonNumber}" data-episode="${index}">
                    <span class="ep-num">E${String(ep.episode_number || index + 1).padStart(2, '0')}</span>
                    <span class="ep-title">${ep.episode_title || `Episode ${index + 1}`}</span>
                    <span class="ep-duration">${epDuration}</span>
                </button>
            `;
        }).join('');

        document.querySelectorAll('.episode-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const season = parseInt(this.dataset.season);
                const episode = parseInt(this.dataset.episode);
                currentSeason = season;
                currentEpisode = episode;
                hasMarkedComplete = false;
                renderSeriesNav(seasons);
                loadEpisode(seasons, season, episode);
            });
        });

        const ep = season.episodes[currentEpisode] || season.episodes[0];
        if (ep) {
            episodeCurrentLabel.textContent = `S${String(seasonNumber).padStart(2, '0')} E${String(ep.episode_number || 1).padStart(2, '0')} - ${ep.episode_title || 'Episode'}`;
        }
    }

    function loadEpisode(seasons, seasonNumber, episodeIndex) {
        const season = seasons.find(s => s.season_number === seasonNumber);
        if (!season || !season.episodes) return;
        const ep = season.episodes[episodeIndex];
        if (!ep) return;

        currentEpisodeId = ep.id;

        if (ep.video_url) {
            source.src = ep.video_url;
            video.load();
        }

        hasMarkedComplete = false;
        isTrackingEnabled = false;
        lastProgressUpdate = 0;

        titleEl.textContent = `${movieData.title} - E${String(ep.episode_number || episodeIndex + 1).padStart(2, '0')}`;
        episodeCurrentLabel.textContent = `S${String(seasonNumber).padStart(2, '0')} E${String(ep.episode_number || episodeIndex + 1).padStart(2, '0')} - ${ep.episode_title || 'Episode'}`;
        descEl.textContent = `${movieData.description || ''} Episode ${ep.episode_number || episodeIndex + 1}: ${ep.episode_title || ''}`;
        
        const epDuration = formatRuntime(ep.duration);
        watchRuntime.textContent = epDuration;

        document.querySelectorAll('.episode-btn').forEach(btn => {
            btn.classList.toggle('active', 
                parseInt(btn.dataset.season) === seasonNumber && 
                parseInt(btn.dataset.episode) === episodeIndex
            );
        });

        setTimeout(() => {
            video.play().catch(() => {});
        }, 500);
        playBtn.textContent = '⏸ Pause';
    }

    // ===== Play Button =====
    playBtn.addEventListener('click', function() {
        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    });

    video.addEventListener('play', function() {
        playBtn.textContent = '⏸ Pause';
    });

    video.addEventListener('pause', function() {
        playBtn.textContent = '▶ Play';
    });

    video.addEventListener('ended', function() {
        playBtn.textContent = '▶ Replay';
    });

    // ===== Buy Movie Button =====
    buyMovieBtn.addEventListener('click', async function() {
        try {
            this.textContent = '⏳ Inachakata...';
            this.disabled = true;
            
            const useCard = confirm('Je, unataka kulipa kwa Kadi ya Benki?\n\n"OK" = Kadi ya Benki\n"Cancel" = M-Pesa/Airtel/Tigo');
            
            let method, phone, cardData = null;
            
            if (useCard) {
                method = 'bank_card';
                
                const cardNumber = prompt('Ingiza namba ya kadi (tarakimu 16, e.g., 4111111111111111):');
                if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
                    alert('Namba ya kadi si sahihi. Tafadhali jaribu tena.');
                    this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                    this.disabled = false;
                    return;
                }
                
                const cardHolder = prompt('Ingiza jina kamili kwenye kadi (e.g., MOHAMMED AMINU):');
                if (!cardHolder || cardHolder.length < 3) {
                    alert('Jina kwenye kadi si sahihi. Tafadhali jaribu tena.');
                    this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                    this.disabled = false;
                    return;
                }
                
                const expiry = prompt('Ingiza tarehe ya kuisha (MM/YY, e.g., 12/26):');
                if (!expiry || !expiry.match(/^\d{2}\/\d{2}$/)) {
                    alert('Tarehe ya kuisha si sahihi. Tafadhali ingiza kwa muundo MM/YY.');
                    this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                    this.disabled = false;
                    return;
                }
                
                const cvv = prompt('Ingiza CVV (tarakimu 3-4 kwenye nyuma ya kadi):');
                if (!cvv || cvv.length < 3) {
                    alert('CVV si sahihi. Tafadhali ingiza tarakimu 3-4.');
                    this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                    this.disabled = false;
                    return;
                }
                
                cardData = {
                    accountName: cardHolder,
                    cardNumber: cardNumber.replace(/\s/g, ''),
                    expiryDate: expiry.replace(/\s/g, ''),
                    cvv: cvv
                };
                
                phone = '';
                
            } else {
                const methodChoice = prompt(`Chagua njia ya malipo:\n1. M-Pesa\n2. Airtel Money\n3. Tigo Pesa\n\nIngiza namba (1-3):`);
                
                if (!methodChoice) {
                    this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                    this.disabled = false;
                    return;
                }
                
                const methodMap = {
                    '1': 'mpesa',
                    '2': 'airtel_money',
                    '3': 'mix_by_yas'
                };
                
                method = methodMap[methodChoice] || 'mpesa';
                
                phone = prompt('Ingiza namba yako ya simu (e.g., 0677532140):');
                if (!phone || phone.length < 9) {
                    alert('Namba ya simu si sahihi. Tafadhali ingiza tarakimu 9-10.');
                    this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                    this.disabled = false;
                    return;
                }
            }
            
            const response = await api.createMoviePurchase(movieId, method, phone, cardData);
            
            if (response.success) {
                const msg = method === 'bank_card' 
                    ? '✅ Malipo ya kadi yameanzishwa!\nTafadhali subiri uthibitisho wa malipo.'
                    : `✅ Malipo yameanzishwa!\nReference: ${response.reference}\nKiasi: TSh ${response.amount}\nTafadhali subiri uthibitisho kwenye simu yako.`;
                
                alert(msg);
                
                let attempts = 0;
                const maxAttempts = 36;
                
                const checkStatus = setInterval(async () => {
                    attempts++;
                    
                    try {
                        const statusRes = await api.verifyMoviePurchase(response.reference);
                        
                        if (statusRes.success && statusRes.payment.status === 'paid') {
                            clearInterval(checkStatus);
                            alert('✅ Malipo yamekamilika! Unaweza kutazama sasa.');
                            window.location.reload();
                            
                        } else if (statusRes.success && statusRes.payment.status === 'failed') {
                            clearInterval(checkStatus);
                            alert('❌ Malipo yameshindwa. Tafadhali jaribu tena.');
                            this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                            this.disabled = false;
                            
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkStatus);
                            alert('⏱️ Muda wa malipo umeisha. Hakuna kiasi kilichotolewa kutoka akaunti yako. Tafadhali jaribu tena.');
                            this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                            this.disabled = false;
                        }
                    } catch (e) {
                        if (attempts >= maxAttempts) {
                            clearInterval(checkStatus);
                            alert('⏱️ Muda wa malipo umeisha. Tafadhali jaribu tena.');
                            this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                            this.disabled = false;
                        }
                    }
                }, 5000);
                
                setTimeout(() => {
                    clearInterval(checkStatus);
                }, maxAttempts * 5000 + 5000);
                
            } else {
                alert(`❌ Malipo yameshindwa: ${response.message || 'Tafadhali jaribu tena.'}`);
                this.textContent = `💳 Nunua - TSh ${movieData.price}`;
                this.disabled = false;
            }
            
        } catch (error) {
            console.error('Purchase error:', error);
            
            let errorMsg = 'Tumeshindwa kuanzisha malipo. Tafadhali jaribu tena.';
            if (error.message.includes('bank_card') || error.message.includes('Card')) {
                errorMsg = '💳 Tatizo la kadi ya benki. Hakikisha namba ya kadi, tarehe ya kuisha, na CVV ni sahihi.';
            } else if (error.message.includes('phone')) {
                errorMsg = '📱 Namba ya simu si sahihi. Hakikisha unaingiza namba sahihi.';
            }
            
            alert(`❌ Error: ${errorMsg}`);
            this.textContent = `💳 Nunua - TSh ${movieData.price}`;
            this.disabled = false;
        }
    });

    // ===== Add Rating Button =====
    const actionsContainer = document.querySelector('.movie-actions');
    if (actionsContainer) {
        const rateBtn = document.createElement('button');
        rateBtn.className = 'watch-btn watch-btn-secondary';
        rateBtn.textContent = userHasRated ? '⭐ Rating Yako' : '⭐ Kadiria Movie';
        rateBtn.addEventListener('click', function() {
            if (canWatch) {
                openRatingModal();
            } else {
                alert('Tafadhali tazama movie hii kwanza kabla ya kuikadiria.');
            }
        });
        actionsContainer.appendChild(rateBtn);
    }
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
        } else if (id === 'navPayment') {
            window.location.href = 'subscription.html';
        }
    });
});

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