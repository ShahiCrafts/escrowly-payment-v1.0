import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

let accessToken = null;
let csrfToken = null;
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const setAccessToken = (token) => {
    accessToken = token;
};

export const clearAccessToken = () => {
    accessToken = null;
};

export const getAccessToken = () => accessToken;

export const fetchCsrfToken = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/csrf-token`, { withCredentials: true });
        csrfToken = response.data.csrfToken;
        console.log('CSRF Token fetched successfully');
        return csrfToken;
    } catch (error) {
        console.error('Failed to fetch CSRF token', error);
        return null; // Don't throw, just return null so app doesn't crash on init
    }
};

api.interceptors.request.use(
    async (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Ensure CSRF token is present for mutation requests
        if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase()) && !csrfToken) {
            await fetchCsrfToken();
        }

        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Delete Content-Type for FormData to let axios auto-set it with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 503) {
            if (window.location.pathname !== '/maintenance' && window.location.pathname !== '/auth/login') {
                window.location.href = '/maintenance';
            }
            return Promise.reject(error);
        }

        if (error.response?.status === 403 && error.response?.data?.require2FA) {
            window.dispatchEvent(new Event('require-2fa'));
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { token } = response.data;
                setAccessToken(token);
                processQueue(null, token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAccessToken();
                if (window.location.pathname !== '/auth/login') {
                    window.location.href = '/auth/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
