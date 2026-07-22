// js/api.js - Central API Service for TanzaFlix

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE;
        this.token = localStorage.getItem('tanzaflix_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('tanzaflix_token', token);
        } else {
            localStorage.removeItem('tanzaflix_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ==================== AUTH ENDPOINTS ====================
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async verifyOTP(email, otp) {
        return this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });
    }

    async resendLoginOTP(email) {
        return this.request('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resendResetOTP(email) {
        return this.request('/auth/resend-reset-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async verifyForgotOTP(email, otp) {
        return this.request('/auth/verify-forgot-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });
    }

    async resetPassword(resetToken, newPassword, confirmPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
        });
    }

    // ==================== USER ENDPOINTS ====================
    async registerUser(userData) {
        const formData = new FormData();
        Object.keys(userData).forEach(key => {
            if (key === 'photo' && userData[key] instanceof File) {
                formData.append('profile_image', userData[key]);
            } else {
                formData.append(key, userData[key]);
            }
        });
        
        return fetch(`${this.baseUrl}/users/register`, {
            method: 'POST',
            body: formData,
        }).then(res => res.json());
    }

    async getProfile() {
        return this.request('/users/profile');
    }

    async updateProfile(profileData) {
        const formData = new FormData();
        Object.keys(profileData).forEach(key => {
            if (key === 'photo' && profileData[key] instanceof File) {
                formData.append('profile_image', profileData[key]);
            } else {
                formData.append(key, profileData[key]);
            }
        });
        
        return fetch(`${this.baseUrl}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        }).then(res => res.json());
    }

    // ==================== MOVIE ENDPOINTS (User) ====================
    async getUserMovies() {
        return this.request('/user/movies');
    }

    async getUserMovie(id) {
        return this.request(`/user/movies/${id}`);
    }

    async markEpisodeComplete(movieId, episodeId, duration, totalDuration) {
        return this.request('/user/movies/mark-episode-complete', {
            method: 'POST',
            body: JSON.stringify({ movieId, episodeId, duration, totalDuration }),
        });
    }

    async markMovieComplete(movieId, duration, totalDuration) {
        return this.request('/user/movies/mark-movie-complete', {
            method: 'POST',
            body: JSON.stringify({ movieId, duration, totalDuration }),
        });
    }

    async getWatchHistory() {
        return this.request('/user/movies/history');
    }

    // ==================== RATING ENDPOINTS ====================
    async rateMovie(movieId, rating, review_text = null) {
        return this.request(`/ratings/movie/${movieId}/rate`, {
            method: 'POST',
            body: JSON.stringify({ rating, review_text }),
        });
    }

    async getMovieRatingDetails(movieId) {
        return this.request(`/ratings/movie/${movieId}/ratings`);
    }

    async getUserRating(movieId) {
        return this.request(`/ratings/movie/${movieId}/my-rating`);
    }

    async getTopRatedMovies(limit = 10, minRatings = 5) {
        return this.request(`/ratings/top-rated?limit=${limit}&min_ratings=${minRatings}`);
    }

    // ==================== ADMIN RATING ENDPOINTS ====================
    async adminGetRatingStats() {
        return this.request('/ratings/admin/stats');
    }

    // ==================== PLANS ENDPOINTS ====================
    async getPlans() {
        return this.request('/plans');
    }

    // ==================== PAYMENT ENDPOINTS ====================
    async createPayment(planId, paymentMethod, phoneNumber, cardData = null) {
        const payload = {
            planId: planId,
            paymentMethod: paymentMethod,
            phoneNumber: phoneNumber || ''
        };
        
        // Add card details if provided
        if (cardData) {
            payload.accountName = cardData.accountName;
            payload.cardNumber = cardData.cardNumber;
            payload.expiryDate = cardData.expiryDate;
            payload.cvv = cardData.cvv;
        }
        
        return this.request('/payments/create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getPaymentStatus(reference) {
        return this.request(`/payments/status/${reference}`);
    }

    async getPaymentHistory() {
        return this.request('/payments/history');
    }

    // ==================== MOVIE PURCHASE ENDPOINTS ====================
    async createMoviePurchase(movieId, paymentMethod, phoneNumber, cardData = null) {
        const payload = {
            paymentMethod: paymentMethod,
            phoneNumber: phoneNumber || ''
        };
        
        // Add card details if provided
        if (cardData) {
            payload.accountName = cardData.accountName;
            payload.cardNumber = cardData.cardNumber;
            payload.expiryDate = cardData.expiryDate;
            payload.cvv = cardData.cvv;
        }
        
        return this.request(`/movie-purchases/create/${movieId}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async verifyMoviePurchase(reference) {
        return this.request(`/movie-purchases/verify/${reference}`);
    }

    // ==================== ADMIN ENDPOINTS ====================
    async adminGetMovies() {
        return this.request('/movies');
    }

    async adminGetMovie(id) {
        return this.request(`/movies/${id}`);
    }

    async adminCreateMovie(movieData) {
        const formData = new FormData();
        Object.keys(movieData).forEach(key => {
            if (movieData[key] !== undefined && movieData[key] !== null) {
                if (key === 'seasons') {
                    formData.append(key, JSON.stringify(movieData[key]));
                } else if (Array.isArray(movieData[key])) {
                    movieData[key].forEach(item => {
                        if (item instanceof File) {
                            formData.append(key, item);
                        }
                    });
                } else if (movieData[key] instanceof File) {
                    formData.append(key, movieData[key]);
                } else {
                    formData.append(key, String(movieData[key]));
                }
            }
        });
        
        return fetch(`${this.baseUrl}/movies`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        }).then(res => res.json());
    }

    async adminUpdateMovie(id, movieData) {
        const formData = new FormData();
        Object.keys(movieData).forEach(key => {
            if (movieData[key] !== undefined && movieData[key] !== null) {
                if (key === 'seasons') {
                    formData.append(key, JSON.stringify(movieData[key]));
                } else if (Array.isArray(movieData[key])) {
                    movieData[key].forEach(item => {
                        if (item instanceof File) {
                            formData.append(key, item);
                        }
                    });
                } else if (movieData[key] instanceof File) {
                    formData.append(key, movieData[key]);
                } else {
                    formData.append(key, String(movieData[key]));
                }
            }
        });
        
        return fetch(`${this.baseUrl}/movies/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        }).then(res => res.json());
    }

    async adminDeleteMovie(id) {
        return this.request(`/movies/${id}`, {
            method: 'DELETE',
        });
    }

    async adminGetMovieStats() {
        return this.request('/movies/stats');
    }

    async adminGetUsers() {
        return this.request('/users');
    }

    async adminCreateUser(userData) {
        const formData = new FormData();
        Object.keys(userData).forEach(key => {
            if (key === 'profile_image' && userData[key] instanceof File) {
                formData.append(key, userData[key]);
            } else {
                formData.append(key, userData[key]);
            }
        });
        
        return fetch(`${this.baseUrl}/users/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        }).then(res => res.json());
    }

    async adminUpdateUser(id, userData) {
        const formData = new FormData();
        Object.keys(userData).forEach(key => {
            if (key === 'profile_image' && userData[key] instanceof File) {
                formData.append(key, userData[key]);
            } else {
                formData.append(key, userData[key]);
            }
        });
        
        return fetch(`${this.baseUrl}/users/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        }).then(res => res.json());
    }

    async adminDeleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE',
        });
    }

    async adminGetUserStats() {
        return this.request('/users/stats');
    }

    async adminGetAllPayments() {
        return this.request('/payments/admin/all');
    }

    async adminGetPaymentStats() {
        return this.request('/payments/admin/stats');
    }

    async adminGetDashboardOverview() {
        return this.request('/admin/activities/dashboard/overview');
    }

    async adminGetRecentActivities(limit = 20) {
        return this.request(`/admin/activities/recent?limit=${limit}`);
    }

    async adminGetUserActivityDetails(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/activities/user-activity?${query}`);
    }

    async adminGetUserDetails(userId) {
        return this.request(`/admin/activities/user/${userId}/details`);
    }

    async adminGetUserEngagementMetrics() {
        return this.request('/admin/activities/engagement/metrics');
    }

    async adminGetUserSegments() {
        return this.request('/admin/activities/segments');
    }

    async adminGetUserDropOffAnalysis() {
        return this.request('/admin/activities/drop-off-analysis');
    }

    async adminGetContentPerformance(period = 30) {
        return this.request(`/admin/activities/content/performance?period=${period}`);
    }

    async adminGetRevenueAnalytics(period = 30) {
        return this.request(`/admin/activities/revenue/analytics?period=${period}`);
    }

    async adminGetActivityStatistics(period = 7) {
        return this.request(`/admin/activities/statistics?period=${period}`);
    }
}

const api = new ApiService();
window.api = api;
export default api;