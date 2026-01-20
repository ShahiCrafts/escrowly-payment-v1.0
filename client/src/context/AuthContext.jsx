import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [pendingCredentials, setPendingCredentials] = useState(null);
    const [show2FASetupModal, setShow2FASetupModal] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
            return response.data.user;
        } catch (error) {
            setUser(null);
            clearAccessToken();
            throw error;
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const response = await api.post('/auth/refresh');
                if (response.data.token) {
                    setAccessToken(response.data.token);
                    await fetchUser();
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, [fetchUser]);

    const login = async (credentials) => {
        const response = await api.post('/auth/login', credentials);

        if (response.data.mfaRequired) {
            setMfaRequired(true);
            setPendingCredentials(credentials);
            return { mfaRequired: true };
        }

        if (response.data.token) {
            setAccessToken(response.data.token);
            setUser(response.data.user);
        }

        return response.data;
    };

    const verifyMFA = async (mfaToken) => {
        if (!pendingCredentials) {
            throw new Error('No pending login');
        }

        const response = await api.post('/auth/login', {
            ...pendingCredentials,
            mfaToken
        });

        if (response.data.token) {
            setAccessToken(response.data.token);
            setUser(response.data.user);
            setMfaRequired(false);
            setPendingCredentials(null);
        }

        return response.data;
    };

    const cancelMFA = () => {
        setMfaRequired(false);
        setPendingCredentials(null);
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);

        if (response.data.token) {
            setAccessToken(response.data.token);
            setUser(response.data.user);
        }

        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
        } finally {
            setUser(null);
            clearAccessToken();
            setMfaRequired(false);
            setPendingCredentials(null);
            setShow2FASetupModal(false);
        }
    };

    const logoutAll = async () => {
        try {
            await api.post('/auth/logout-all');
        } catch (error) {
        } finally {
            setUser(null);
            clearAccessToken();
        }
    };

    const forgotPassword = async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    };

    const resetPassword = async (token, password) => {
        const response = await api.post('/auth/reset-password', { token, password });
        return response.data;
    };

    const changePassword = async (currentPassword, newPassword) => {
        const response = await api.post('/auth/change-password', { currentPassword, newPassword });
        clearAccessToken();
        setUser(null);
        return response.data;
    };

    const deleteAccount = async () => {
        const response = await api.delete('/auth/account');
        setUser(null);
        clearAccessToken();
        return response.data;
    };

    const verifyEmail = async (token) => {
        const response = await api.post('/auth/verify-email', { token });

        if (response.data.token) {
            setAccessToken(response.data.token);
            setUser(response.data.user);
        } else if (user) {
            setUser({ ...user, isEmailVerified: true });
        }

        return response.data;
    };

    const resendVerification = async () => {
        const response = await api.post('/auth/resend-verification');
        return response.data;
    };

    const setupMFA = async () => {
        const response = await api.post('/auth/mfa/setup');
        return response.data;
    };

    const enableMFA = async (token) => {
        const response = await api.post('/auth/mfa/enable', { token });
        setUser({ ...user, mfaEnabled: true });
        return response.data;
    };

    const disableMFA = async (password) => {
        const response = await api.post('/auth/mfa/disable', { password });
        setUser({ ...user, mfaEnabled: false });
        return response.data;
    };

    const getBackupCodes = async (password) => {
        const response = await api.post('/auth/mfa/backup-codes', { password });
        return response.data;
    };

    const regenerateBackupCodes = async (password) => {
        const response = await api.post('/auth/mfa/regenerate-backup-codes', { password });
        return response.data;
    };

    const getSessions = async () => {
        const response = await api.get('/auth/sessions');
        return response.data;
    };

    const revokeSession = async (sessionId) => {
        const response = await api.delete(`/auth/sessions/${sessionId}`);
        return response.data;
    };

    const updateUser = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };



    return (
        <AuthContext.Provider value={{
            user,
            loading,
            mfaRequired,
            login,
            verifyMFA,
            cancelMFA,
            register,
            logout,
            logoutAll,
            forgotPassword,
            resetPassword,
            changePassword,
            deleteAccount,
            verifyEmail,
            resendVerification,
            setupMFA,
            enableMFA,
            disableMFA,
            getBackupCodes,
            regenerateBackupCodes,
            getSessions,
            revokeSession,
            updateUser,
            fetchUser,
            refreshUser: fetchUser,
            show2FASetupModal,
            setShow2FASetupModal
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
