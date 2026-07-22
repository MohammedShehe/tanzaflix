// js/auth.js - Authentication Module

import api from './api.js';

class AuthManager {
    constructor() {
        this.user = null;
        this.isAdmin = false;
        this.isAuthenticated = false;
        this._loadSession();
    }

    _loadSession() {
        try {
            const userData = localStorage.getItem('tanzaflix_user');
            if (userData) {
                this.user = JSON.parse(userData);
                this.isAuthenticated = true;
                this.isAdmin = this.user?.role === 'admin';
                if (this.user?.token) {
                    api.setToken(this.user.token);
                }
            }
        } catch (e) {
            console.warn('Failed to load session:', e);
        }
    }

    _saveSession(userData) {
        localStorage.setItem('tanzaflix_user', JSON.stringify(userData));
        this.user = userData;
        this.isAuthenticated = true;
        this.isAdmin = userData?.role === 'admin';
        if (userData?.token) {
            api.setToken(userData.token);
        }
    }

    async login(email, password) {
        try {
            const response = await api.login(email, password);
            
            if (response.success) {
                if (response.role === 'admin' && response.requiresOTP) {
                    this._saveSession({
                        email: response.email,
                        role: 'admin',
                        requiresOTP: true,
                    });
                    return { requiresOTP: true, email: response.email };
                } else if (response.role === 'user') {
                    this._saveSession({
                        email: email,
                        role: 'user',
                        token: response.token,
                    });
                    return { success: true, role: 'user' };
                }
            }
            
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async verifyOTP(email, otp) {
        try {
            const response = await api.verifyOTP(email, otp);
            
            if (response.success === true || response.token) {
                this._saveSession({
                    email: email,
                    role: 'admin',
                    token: response.token,
                    isAdmin: true,
                });
                localStorage.setItem('tanzaflix_admin_session', 'true');
                return { success: true, token: response.token };
            }
            
            throw new Error(response.message || 'OTP verification failed');
        } catch (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
    }

    async forgotPassword(email) {
        try {
            const response = await api.forgotPassword(email);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Failed to send OTP');
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    // ===== RESEND PASSWORD RESET OTP =====
    async resendResetOTP(email) {
        try {
            const response = await api.resendResetOTP(email);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Failed to resend OTP');
        } catch (error) {
            console.error('Resend reset OTP error:', error);
            throw error;
        }
    }

    async verifyForgotOTP(email, otp) {
        try {
            const response = await api.verifyForgotOTP(email, otp);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Invalid OTP');
        } catch (error) {
            console.error('Verify forgot OTP error:', error);
            throw error;
        }
    }

    async resetPassword(resetToken, newPassword, confirmPassword) {
        try {
            const response = await api.resetPassword(resetToken, newPassword, confirmPassword);
            if (response.success) {
                return response;
            }
            throw new Error(response.message || 'Password reset failed');
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('tanzaflix_user');
        localStorage.removeItem('tanzaflix_token');
        localStorage.removeItem('tanzaflix_admin_session');
        localStorage.removeItem('tanzaflix_subscription');
        api.setToken(null);
        this.user = null;
        this.isAuthenticated = false;
        this.isAdmin = false;
        window.location.href = 'index.html';
    }

    checkAuth() {
        if (!this.isAuthenticated) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    checkAdmin() {
        if (!this.isAuthenticated || !this.isAdmin) {
            window.location.href = 'dashboard.html';
            return false;
        }
        return true;
    }

    getToken() {
        return api.token;
    }

    getUser() {
        return this.user;
    }

    isAdminUser() {
        return this.isAdmin;
    }
}

const auth = new AuthManager();
window.auth = auth;
export default auth;