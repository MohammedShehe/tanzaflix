// js/watch.js - Watch Page with Professional Payment Flow

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
    const paywallTitle = document.getElementById('paywallTitle');
    const paywallMessage = document.getElementById('paywallMessage');
    const buyMovieBtn = document.getElementById('buyMovieBtn');
    const watchYear = document.getElementById('watchYear');
    const watchGenre = document.getElementById('watchGenre');
    const watchRuntime = document.getElementById('watchRuntime');
    const watchLang = document.getElementById('watchLang');
    const watchCountry = document.getElementById('watchCountry');
    const streamingBadge = document.getElementById('streamingBadge');
    const accessBadge = document.getElementById('accessBadge');
    const ratingText = document.getElementById('ratingText');

    // Payment Modal Elements
    const paymentModal = document.getElementById('paymentModal');
    const paymentModalClose = document.getElementById('paymentModalClose');
    const paymentAmount = document.getElementById('paymentAmount');
    const paymentMovieTitle = document.getElementById('paymentMovieTitle');
    const paymentMovieId = document.getElementById('paymentMovieId');
    const paymentMethod = document.getElementById('paymentMethod');
    const paymentPhone = document.getElementById('paymentPhone');
    const paymentCardHolder = document.getElementById('paymentCardHolder');
    const paymentCardNumber = document.getElementById('paymentCardNumber');
    const paymentCardExpiry = document.getElementById('paymentCardExpiry');
    const paymentCardCvv = document.getElementById('paymentCardCvv');
    const paymentStatus = document.getElementById('paymentStatus');
    const paymentSubmitBtn = document.getElementById('paymentSubmitBtn');
    const paymentForm = document.getElementById('paymentForm');
    const mobileMoneyFields = document.getElementById('mobileMoneyFields');
    const cardFields = document.getElementById('cardFields');

    // Rating Modal Elements
    const ratingModal = document.getElementById('ratingModal');
    const ratingModalClose = document.getElementById('ratingModalClose');
    const ratingCancelBtn = document.getElementById('ratingCancelBtn');
    const ratingModalTitle = document.getElementById('ratingModalTitle');
    const ratingMovieId = document.getElementById('ratingMovieId');
    const ratingReview = document.getElementById('ratingReview');
    const ratingMessage = document.getElementById('ratingMessage');
    const submitRatingBtn = document.getElementById('submitRatingBtn');
    const ratingSelectedDisplay = document.getElementById('ratingSelectedDisplay');
    const ratingStars = document.getElementById('ratingStars');

    let movieData = null;
    let currentSeason = 1;
    let currentEpisode = 0;
    let isSeries = false;
    let canWatch = false;
    let accessType = null;
    let isFirstTime = false;
    let selectedPaymentMethod = null;
    let selectedRating = 0;
    let userHasRated = false;
    let userRatingData = null;
    let paymentReference = null;
    let paymentCheckInterval = null;
    
    // Real-time tracking variables
    let lastProgressUpdate = 0;
    const PROGRESS_INTERVAL = 5;
    let isTrackingEnabled = false;
    let currentEpisodeId = null;
    let totalDuration = 0;
    let hasMarkedComplete = false;

    // Store movie data globally for the buy button
    let currentMovieData = {
        id: null,
        title: null,
        price: 0
    };

    // Show loading state
    titleEl.textContent = 'Inapakia...';

    // Country Display Map
    const countryMap = {
        'Movie ya Kiengereza': '🇺🇸 Kiengereza',
        'Bongo Movie': '🇹🇿 Bongo',
        'Movie ya Kiarabu': '🇸🇦 Kiarabu',
        'Movie ya Kifilipino': '🇵🇭 Kifilipino',
        'Movie ya Kihindi': '🇮🇳 Kihindi',
        'Movie ya Kitaliano': '🇮🇹 Kitaliano',
        'Movie ya Kikorea': '🇰🇷 Kikorea'
    };

    // ===== Payment Modal Functions =====

    function openPaymentModal(movieId, movieTitle, price) {
        const displayPrice = parseFloat(price) || 0;
        
        paymentMovieId.value = movieId || '';
        paymentAmount.textContent = `TSh ${Number(displayPrice).toLocaleString()}`;
        paymentMovieTitle.textContent = movieTitle || 'Filamu';
        paymentStatus.className = 'payment-status';
        paymentStatus.style.display = 'none';
        paymentStatus.textContent = '';
        selectedPaymentMethod = null;
        paymentMethod.value = '';
        paymentPhone.value = '';
        paymentCardHolder.value = '';
        paymentCardNumber.value = '';
        paymentCardExpiry.value = '';
        paymentCardCvv.value = '';
        paymentSubmitBtn.disabled = false;
        paymentSubmitBtn.innerHTML = '⚡ Malipo Sasa';
        
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        mobileMoneyFields.style.display = 'block';
        cardFields.style.display = 'none';
        
        paymentModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closePaymentModal() {
        if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
            paymentCheckInterval = null;
        }
        paymentModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function showPaymentStatus(message, type = 'info') {
        paymentStatus.className = `payment-status ${type}`;
        paymentStatus.textContent = message;
        paymentStatus.style.display = 'block';
    }

    // Payment method selection
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const method = this.dataset.method;
            selectedPaymentMethod = method;
            paymentMethod.value = method;
            
            if (method === 'bank_card') {
                mobileMoneyFields.style.display = 'none';
                cardFields.style.display = 'block';
            } else {
                mobileMoneyFields.style.display = 'block';
                cardFields.style.display = 'none';
            }
            
            paymentStatus.className = 'payment-status';
            paymentStatus.style.display = 'none';
        });
    });

    // Payment form submission
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!selectedPaymentMethod) {
            showPaymentStatus('⚠️ Tafadhali chagua njia ya malipo.', 'error');
            return;
        }

        const movieId = paymentMovieId.value;
        let phone = '';
        let cardData = null;

        if (selectedPaymentMethod === 'bank_card') {
            const cardNumber = paymentCardNumber.value.replace(/\s/g, '');
            const expiry = paymentCardExpiry.value.replace(/\s/g, '');
            const cvv = paymentCardCvv.value;
            const cardHolder = paymentCardHolder.value.trim();

            if (!cardNumber || cardNumber.length < 13) {
                showPaymentStatus('⚠️ Namba ya kadi si sahihi. Tafadhali ingiza tarakimu 13-19.', 'error');
                return;
            }
            if (!expiry || !expiry.match(/^\d{2}\/\d{2}$/)) {
                showPaymentStatus('⚠️ Tarehe ya kuisha si sahihi. Tafadhali ingiza kwa muundo MM/YY.', 'error');
                return;
            }
            if (!cvv || cvv.length < 3) {
                showPaymentStatus('⚠️ CVV si sahihi. Tafadhali ingiza tarakimu 3-4.', 'error');
                return;
            }
            if (!cardHolder || cardHolder.length < 3) {
                showPaymentStatus('⚠️ Jina kwenye kadi si sahihi.', 'error');
                return;
            }

            cardData = {
                accountName: cardHolder,
                cardNumber: cardNumber,
                expiryDate: expiry,
                cvv: cvv
            };
        } else {
            phone = paymentPhone.value.replace(/\s/g, '');
            if (!phone || phone.length < 9) {
                showPaymentStatus('⚠️ Namba ya simu si sahihi. Tafadhali ingiza tarakimu 9-10.', 'error');
                return;
            }
        }

        paymentSubmitBtn.disabled = true;
        paymentSubmitBtn.innerHTML = '<span class="payment-loading-spinner"></span> Inachakata...';
        showPaymentStatus('⏳ Inaanzisha malipo...', 'info');

        try {
            const response = await api.createMoviePurchase(
                movieId,
                selectedPaymentMethod,
                phone,
                cardData
            );

            if (response.success) {
                paymentReference = response.reference;
                showPaymentStatus(
                    `✅ Malipo yameanzishwa!\nReference: ${response.reference}\nKiasi: TSh ${Number(response.amount).toLocaleString()}\nTafadhali subiri uthibitisho.`,
                    'success'
                );
                
                paymentSubmitBtn.innerHTML = '⏳ Inasubiri uthibitisho...';
                startPaymentPolling(response.reference);
            } else {
                throw new Error(response.message || 'Malipo yameshindwa');
            }
        } catch (error) {
            let errorMsg = 'Tumeshindwa kuanzisha malipo. Tafadhali jaribu tena.';
            const errorMessage = error.message || '';
            
            if (errorMessage.includes('ALREADY_PURCHASED') || 
                errorMessage.includes('Duplicate entry') ||
                errorMessage.includes('already have access') ||
                errorMessage.includes('already have a purchase') ||
                errorMessage.includes('You already have access')) {
                
                errorMsg = '✅ Tayari umenunua filamu hii! Unaweza kuitazama sasa.';
                showPaymentStatus(`✅ ${errorMsg}`, 'success');
                paymentSubmitBtn.innerHTML = '✅ Tayari Imegharamiwa';
                
                setTimeout(() => {
                    closePaymentModal();
                    window.location.reload();
                }, 2000);
                return;
            } 
            else if (errorMessage.includes('PENDING_PURCHASE') || 
                     errorMessage.includes('pending purchase')) {
                errorMsg = '⏳ Malipo yako yanachakatwa. Tafadhali subiri uthibitisho.';
                showPaymentStatus(`⏳ ${errorMsg}`, 'info');
                paymentSubmitBtn.disabled = false;
                paymentSubmitBtn.innerHTML = '⚡ Malipo Sasa';
                return;
            } 
            else if (errorMessage.includes('bank_card') || 
                     errorMessage.includes('Card') || 
                     errorMessage.includes('card')) {
                errorMsg = '💳 Tatizo la kadi ya benki. Hakikisha namba ya kadi, tarehe ya kuisha, na CVV ni sahihi.';
            } 
            else if (errorMessage.includes('phone')) {
                errorMsg = '📱 Namba ya simu si sahihi. Hakikisha unaingiza namba sahihi.';
            }
            
            showPaymentStatus(`❌ ${errorMsg}`, 'error');
            paymentSubmitBtn.disabled = false;
            paymentSubmitBtn.innerHTML = '⚡ Malipo Sasa';
        }
    });

    function startPaymentPolling(reference) {
        let attempts = 0;
        const maxAttempts = 36;
        
        if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
        }
        
        paymentCheckInterval = setInterval(async () => {
            attempts++;
            
            try {
                const statusRes = await api.verifyMoviePurchase(reference);
                
                if (statusRes.success && statusRes.payment) {
                    if (statusRes.payment.status === 'paid') {
                        clearInterval(paymentCheckInterval);
                        paymentCheckInterval = null;
                        showPaymentStatus('✅ Malipo yamekamilika! Unaweza kutazama sasa.', 'success');
                        paymentSubmitBtn.innerHTML = '✅ Malipo Yamekamilika';
                        
                        setTimeout(() => {
                            closePaymentModal();
                            window.location.reload();
                        }, 2000);
                    } else if (statusRes.payment.status === 'failed') {
                        clearInterval(paymentCheckInterval);
                        paymentCheckInterval = null;
                        showPaymentStatus('❌ Malipo yameshindwa. Tafadhali jaribu tena.', 'error');
                        paymentSubmitBtn.disabled = false;
                        paymentSubmitBtn.innerHTML = '⚡ Malipo Sasa';
                    } else if (attempts >= maxAttempts) {
                        clearInterval(paymentCheckInterval);
                        paymentCheckInterval = null;
                        showPaymentStatus('⏱️ Muda wa malipo umeisha. Tafadhali jaribu tena.', 'error');
                        paymentSubmitBtn.disabled = false;
                        paymentSubmitBtn.innerHTML = '⚡ Malipo Sasa';
                    }
                }
            } catch (e) {
                if (attempts >= maxAttempts) {
                    clearInterval(paymentCheckInterval);
                    paymentCheckInterval = null;
                    showPaymentStatus('⏱️ Muda wa malipo umeisha. Tafadhali jaribu tena.', 'error');
                    paymentSubmitBtn.disabled = false;
                    paymentSubmitBtn.innerHTML = '⚡ Malipo Sasa';
                }
            }
        }, 5000);
    }

    // Close payment modal
    paymentModalClose.addEventListener('click', closePaymentModal);
    paymentModal.addEventListener('click', function(e) {
        if (e.target === this) closePaymentModal();
    });

    // ===== Rating Modal Functions =====

    function openRatingModal() {
        if (!movieData) return;
        
        selectedRating = 0;
        ratingReview.value = '';
        ratingSelectedDisplay.textContent = 'Hakuna rating iliyochaguliwa';
        ratingMessage.className = 'rating-message';
        ratingMessage.style.display = 'none';
        submitRatingBtn.disabled = false;
        submitRatingBtn.textContent = 'Tuma Rating';
        
        document.querySelectorAll('.rating-star-btn').forEach(el => {
            el.className = 'rating-star-btn';
        });

        if (userHasRated && userRatingData) {
            ratingModalTitle.textContent = 'Rating Yako';
            ratingSelectedDisplay.textContent = `Rating yako: ${userRatingData.rating}/10`;
            document.querySelectorAll('.rating-star-btn').forEach(el => {
                const val = parseInt(el.dataset.value);
                if (val <= userRatingData.rating) {
                    el.classList.add('selected');
                }
            });
            submitRatingBtn.textContent = '✅ Tayari Umerate';
            submitRatingBtn.disabled = true;
            if (userRatingData.review_text) {
                ratingReview.value = userRatingData.review_text;
            }
        } else {
            ratingModalTitle.textContent = `Kadiria: ${movieData.title || 'Movie'}`;
        }

        ratingMovieId.value = movieData.id;
        ratingModal.style.display = 'flex';
    }

    function closeRatingModal() {
        ratingModal.style.display = 'none';
    }

    // Rating star selection
    document.querySelectorAll('.rating-star-btn').forEach(el => {
        el.addEventListener('click', function() {
            if (userHasRated) return;
            
            const value = parseInt(this.dataset.value);
            selectedRating = value;
            
            document.querySelectorAll('.rating-star-btn').forEach(star => {
                const starVal = parseInt(star.dataset.value);
                if (starVal <= value) {
                    star.classList.add('selected');
                } else {
                    star.classList.remove('selected');
                }
            });
            
            ratingSelectedDisplay.textContent = `Rating: ${value}/10`;
        });
    });

    // Rating form submission
    document.getElementById('ratingForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (userHasRated) {
            closeRatingModal();
            return;
        }

        const movieId = ratingMovieId.value;
        const review = ratingReview.value.trim();

        if (!selectedRating || selectedRating < 1 || selectedRating > 10) {
            ratingMessage.className = 'rating-message error';
            ratingMessage.textContent = '⚠️ Tafadhali chagua rating kati ya 1 na 10.';
            ratingMessage.style.display = 'block';
            return;
        }

        submitRatingBtn.disabled = true;
        submitRatingBtn.textContent = '⏳ Inatuma...';

        try {
            const response = await api.rateMovie(movieId, selectedRating, review || null);
            
            if (response.success) {
                ratingMessage.className = 'rating-message success';
                ratingMessage.textContent = '✅ Rating imetumwa kwa mafanikio!';
                ratingMessage.style.display = 'block';
                
                userHasRated = true;
                userRatingData = {
                    rating: selectedRating,
                    review_text: review || null
                };
                
                updateRatingDisplay();
                
                submitRatingBtn.textContent = '✅ Imefanikiwa';
                submitRatingBtn.disabled = true;
                
                setTimeout(() => {
                    closeRatingModal();
                }, 1500);
            } else {
                throw new Error(response.message || 'Rating failed');
            }
        } catch (error) {
            ratingMessage.className = 'rating-message error';
            ratingMessage.textContent = `❌ ${error.message || 'Tumeshindwa kutuma rating. Tafadhali jaribu tena.'}`;
            ratingMessage.style.display = 'block';
            submitRatingBtn.disabled = false;
            submitRatingBtn.textContent = 'Tuma Rating';
        }
    });

    // Close rating modal
    ratingModalClose.addEventListener('click', closeRatingModal);
    ratingCancelBtn.addEventListener('click', closeRatingModal);
    ratingModal.addEventListener('click', function(e) {
        if (e.target === this) closeRatingModal();
    });

    // ===== Utility Functions =====

    function formatRuntime(minutes) {
        if (!minutes || minutes <= 0) return 'N/A';
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
        let moviePrice = 0;
        let movieTitleValue = 'Filamu';
        let movieIdValue = movieId;
        let isPurchasePending = false;
        let purchaseStatusText = null;
        
        // Try user endpoint first (most important for access control)
        try {
            const userResponse = await api.getUserMovie(movieId);
            if (userResponse.success && userResponse.movie) {
                const userMovie = userResponse.movie;
                movieIdValue = userMovie.id || movieId;
                movieTitleValue = userMovie.title || 'Filamu';
                moviePrice = parseFloat(userMovie.price) || 0;
                
                movieData = userMovie;
                
                if (userMovie.canWatch !== undefined && userMovie.canWatch !== null) {
                    canWatch = userMovie.canWatch;
                }
                
                if (userMovie.isPurchasePending) {
                    isPurchasePending = true;
                    purchaseStatusText = userMovie.purchaseStatus || 'pending';
                }
                
                accessType = userMovie.accessType || null;
                isSeries = userMovie.movie_type === 'series';
                isFirstTime = userMovie.isFirstTime || false;
                
                if (movieData.rating) {
                    userHasRated = movieData.rating.user_has_rated || false;
                    userRatingData = movieData.rating.user_rating || null;
                }
            }
        } catch (userError) {
            // Silently handle error
        }
        
        if (!movieData) {
            try {
                const adminResponse = await api.adminGetMovie(movieId);
                if (adminResponse.success && adminResponse.movie) {
                    const adminMovie = adminResponse.movie;
                    movieIdValue = adminMovie.id || movieId;
                    movieTitleValue = adminMovie.title || 'Filamu';
                    moviePrice = parseFloat(adminMovie.price) || 0;
                }
            } catch (adminError) {
                // Silently handle error
            }
        }
        
        if (moviePrice === 0) {
            try {
                const moviesResponse = await api.getUserMovies();
                if (moviesResponse.success && moviesResponse.movies) {
                    const foundMovie = moviesResponse.movies.find(m => m.id == movieId);
                    if (foundMovie) {
                        movieTitleValue = foundMovie.title || 'Filamu';
                        moviePrice = parseFloat(foundMovie.price) || 0;
                    }
                }
            } catch (listError) {
                // Silently handle error
            }
        }

        // Store movie data globally
        currentMovieData = {
            id: movieIdValue,
            title: movieTitleValue,
            price: moviePrice
        };

        if (!movieData) {
            movieData = {
                id: movieIdValue,
                title: movieTitleValue,
                price: moviePrice,
                canWatch: canWatch || false,
                accessType: accessType || 'denied',
                movie_type: 'single',
                isFirstTime: false,
                description: '',
                year: '',
                category: '',
                movie_time: '',
                language: '',
                country: '',
                poster: '',
                rating: { average: 0, total: 0 },
                more_like_this: []
            };
        } else {
            movieData.title = movieTitleValue;
            movieData.price = moviePrice;
            movieData.canWatch = canWatch || movieData.canWatch || false;
        }

        // Populate UI
        titleEl.textContent = movieTitleValue;
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

        if (isPurchasePending && !canWatch) {
            streamingBadge.style.display = 'inline-flex';
            streamingBadge.textContent = '⏳ Malipo Yanachakatwa...';
            streamingBadge.style.background = 'rgba(251, 191, 36, 0.15)';
            streamingBadge.style.borderColor = 'rgba(251, 191, 36, 0.2)';
            streamingBadge.style.color = '#fbbf24';
            accessBadge.style.display = 'none';
        } else if (canWatch) {
            streamingBadge.style.display = 'inline-flex';
            accessBadge.style.display = 'none';
            if (accessType === 'subscription') {
                streamingBadge.textContent = '▶ Premium Streaming';
            } else if (accessType === 'free_trial') {
                streamingBadge.textContent = '✅ Free Trial - First Time Watching';
            } else if (accessType === 'paid_single' || accessType === 'purchased') {
                streamingBadge.textContent = '✅ Imegharamiwa - Tazama Sasa';
                streamingBadge.style.background = 'rgba(34,197,94,0.15)';
                streamingBadge.style.borderColor = 'rgba(34,197,94,0.2)';
                streamingBadge.style.color = '#4ade80';
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

        // ===== PAYWALL HANDLING =====
        if (!canWatch) {
            if (isPurchasePending) {
                paywallOverlay.style.display = 'flex';
                seriesNav.style.display = 'none';
                paywallTitle.textContent = '⏳ Malipo Yanachakatwa';
                paywallMessage.textContent = 'Malipo yako ya filamu hii yanachakatwa. Tafadhali subiri kwa muda mfupi, kisha onyesha upya ukurasa.';
                buyMovieBtn.textContent = '🔄 Onyesha Upya Ukurasa';
                
                const newBuyBtn = buyMovieBtn.cloneNode(true);
                buyMovieBtn.parentNode.replaceChild(newBuyBtn, buyMovieBtn);
                const buyBtn = document.getElementById('buyMovieBtn');
                buyBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.reload();
                });
                
                if (movieData.more_like_this && movieData.more_like_this.length > 0) {
                    renderRecommendations(movieData.more_like_this);
                }
                
                return;
            }
            
            paywallOverlay.style.display = 'flex';
            seriesNav.style.display = 'none';
            
            const price = currentMovieData.price;
            const id = currentMovieData.id;
            const title = currentMovieData.title;
            
            if (price > 0) {
                buyMovieBtn.textContent = `💳 Nunua - TSh ${Number(price).toLocaleString()}`;
            } else {
                buyMovieBtn.textContent = '💳 Nunua Filamu';
            }
            
            buyMovieBtn.dataset.movieId = id;
            buyMovieBtn.dataset.movieTitle = title;
            buyMovieBtn.dataset.moviePrice = price;
            
            if (accessType === 'trial_used') {
                paywallTitle.textContent = 'Muda wako wa kutazama bure umeisha';
                paywallMessage.textContent = 'Umeshatazama filamu/kipindi chako cha bure. Nunua filamu hii au jisajili ili uendelee kutazama filamu na mfululizo bila kikomo.';
            } else if (accessType === 'denied') {
                paywallTitle.textContent = '🔒 Hakuna Ufikiaji';
                paywallMessage.textContent = 'Unahitaji kujiandikisha au kununua filamu hii ili kuendelea kutazama. Jisajili sasa na upate ufikiaji wa filamu zote!';
            } else {
                paywallTitle.textContent = '🔒 Ufikiaji Unahitajika';
                paywallMessage.textContent = 'Tafadhali jisajili au nunua filamu hii ili kuendelea kutazama.';
            }
            
            if (movieData.more_like_this && movieData.more_like_this.length > 0) {
                renderRecommendations(movieData.more_like_this);
            }
            
            const newBuyBtn = buyMovieBtn.cloneNode(true);
            buyMovieBtn.parentNode.replaceChild(newBuyBtn, buyMovieBtn);
            
            const buyBtn = document.getElementById('buyMovieBtn');
            
            buyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                let movieId = this.dataset.movieId;
                let movieTitle = this.dataset.movieTitle;
                let moviePrice = this.dataset.moviePrice;
                
                if (!movieId || movieId === 'undefined' || movieId === 'null') {
                    movieId = currentMovieData.id;
                }
                
                if (!movieTitle || movieTitle === 'undefined' || movieTitle === 'null' || movieTitle === 'Inapakia...') {
                    movieTitle = currentMovieData.title || 'Filamu';
                }
                
                if (moviePrice === '0' || moviePrice === 0 || moviePrice === undefined || moviePrice === 'undefined' || moviePrice === 'null' || moviePrice === '') {
                    moviePrice = currentMovieData.price || 0;
                }
                
                if (!movieId || movieId === 'undefined' || movieId === 'null') {
                    const urlParams = new URLSearchParams(window.location.search);
                    movieId = urlParams.get('id');
                }
                
                if (!movieId || movieId === 'undefined' || movieId === 'null') {
                    alert('Taarifa za filamu hazipatikani. Tafadhali jaribu tena.');
                    return;
                }
                
                let price = 0;
                if (moviePrice !== undefined && moviePrice !== null && moviePrice !== '' && moviePrice !== 'undefined' && moviePrice !== 'null') {
                    price = parseFloat(moviePrice);
                    if (isNaN(price)) price = 0;
                }
                
                if (!movieTitle || movieTitle === 'undefined' || movieTitle === 'null' || movieTitle === 'Inapakia...') {
                    movieTitle = 'Filamu';
                }
                
                this.dataset.movieId = movieId;
                this.dataset.movieTitle = movieTitle;
                this.dataset.moviePrice = price;
                
                openPaymentModal(movieId, movieTitle, price);
            });
            
            return;
        }

        // If can watch, load video
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
        const errorMessage = error.message || 'Movie not found';
        const isAccessDenied = errorMessage.includes('subscribe') || 
                              errorMessage.includes('purchase') || 
                              errorMessage.includes('access') ||
                              errorMessage.includes('403');
        
        if (isAccessDenied) {
            paywallOverlay.style.display = 'flex';
            paywallTitle.textContent = '🔒 Ufikiaji Unahitajika';
            paywallMessage.textContent = 'Unahitaji kujiandikisha au kununua filamu hii ili kuendelea kutazama. Jisajili sasa na upate ufikiaji wa filamu zote!';
            buyMovieBtn.textContent = '💳 Nunua Filamu';
            
            const newBuyBtn = buyMovieBtn.cloneNode(true);
            buyMovieBtn.parentNode.replaceChild(newBuyBtn, buyMovieBtn);
            
            const buyBtn = document.getElementById('buyMovieBtn');
            
            buyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const urlParams = new URLSearchParams(window.location.search);
                const movieIdFromUrl = urlParams.get('id');
                
                let movieId = this.dataset.movieId || movieIdFromUrl;
                let movieTitle = this.dataset.movieTitle || titleEl.textContent || 'Filamu';
                let moviePrice = parseFloat(this.dataset.moviePrice) || 0;
                
                if (!movieId || movieId === 'undefined' || movieId === 'null') {
                    movieId = movieIdFromUrl;
                }
                
                if (!movieId) {
                    alert('Taarifa za filamu hazipatikani. Tafadhali jaribu tena.');
                    return;
                }
                
                openPaymentModal(movieId, movieTitle, moviePrice);
            });
        } else {
            const movieInfo = document.querySelector('.movie-info');
            movieInfo.innerHTML = `
                <div style="text-align:center;padding:2rem;color:var(--watch-muted);">
                    <p style="font-size:1.2rem;color:#f87171;">Error loading movie</p>
                    <p>${errorMessage}</p>
                    <div style="margin-top:1.5rem;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                        <a href="subscription.html" class="watch-btn watch-btn-subscribe">⭐ Jisajili Sasa</a>
                        <a href="movies.html" style="color:#6c63ff;text-decoration:none;font-weight:600;padding:10px 20px;border:1px solid rgba(108,99,255,0.3);border-radius:999px;">← Rudi kwenye Movies</a>
                    </div>
                </div>
            `;
        }
    }

    // ===== Render Functions =====

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
    if (modal) modal.style.display = 'flex';
}

function closeModals() {
    document.querySelectorAll('.about-modal, .payment-modal, .rating-modal').forEach(m => {
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

document.querySelectorAll('.about-modal-close').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

document.querySelectorAll('.about-modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModals();
    });
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModals();
    }
});