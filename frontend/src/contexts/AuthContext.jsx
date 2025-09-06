import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Check authentication status
    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Set auth header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Verify token by getting user info
            const response = await api.get('/auth/me');
            setUser(response.data.data.user);
        } catch (error) {
            console.error('Auth check failed:', error);
            // Token is invalid, clear it
            localStorage.removeItem('accessToken');
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    // Login function
    const login = async (emailOrUsername, password) => {
        try {
            setError(null);
            const response = await api.post('/auth/login', {
                emailOrUsername,
                password
            });

            const { user, accessToken } = response.data.data;
            
            // Store token
            localStorage.setItem('accessToken', accessToken);
            
            // Set auth header for future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // Set user state
            setUser(user);
            
            // Navigate to dashboard
            navigate('/');
            
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Signup function
    const signup = async (userData) => {
        try {
            setError(null);
            const response = await api.post('/auth/signup', userData);

            const { user, accessToken } = response.data.data;
            
            // Store token
            localStorage.setItem('accessToken', accessToken);
            
            // Set auth header for future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // Set user state
            setUser(user);
            
            // Navigate to dashboard
            navigate('/');
            
            return { success: true, verificationToken: response.data.data.verificationToken };
        } catch (error) {
            const message = error.response?.data?.message || 'Signup failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state regardless
            localStorage.removeItem('accessToken');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            navigate('/login');
        }
    };

    // Refresh token function
    const refreshToken = async () => {
        try {
            const response = await api.post('/auth/refresh');
            const { accessToken } = response.data.data;
            
            // Update token
            localStorage.setItem('accessToken', accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Refresh failed, logout user
            await logout();
            return false;
        }
    };

    // Update profile function
    const updateProfile = async (updates) => {
        try {
            setError(null);
            const response = await api.put('/auth/profile', updates);
            const updatedUser = response.data.data.user;
            setUser(updatedUser);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Profile update failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Request password reset
    const requestPasswordReset = async (email) => {
        try {
            setError(null);
            const response = await api.post('/auth/request-password-reset', { email });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || 'Password reset request failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Reset password
    const resetPassword = async (token, newPassword) => {
        try {
            setError(null);
            const response = await api.post('/auth/reset-password', {
                token,
                newPassword
            });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || 'Password reset failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Axios interceptor for token refresh
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                // Don't attempt to refresh if this is already a refresh request or auth endpoint
                const isAuthEndpoint = originalRequest.url?.includes('/auth/refresh') || 
                                     originalRequest.url?.includes('/auth/login');
                
                if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
                    originalRequest._retry = true;
                    
                    const refreshed = await refreshToken();
                    if (refreshed) {
                        // Retry the original request
                        return api(originalRequest);
                    }
                }
                
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    const value = {
        user,
        loading,
        error,
        login,
        signup,
        logout,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};