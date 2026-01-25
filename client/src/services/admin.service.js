import api from './api';

export const getAnalytics = async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const getUserById = async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
};

export const suspendUser = async (id, reason) => {
    const response = await api.post(`/admin/users/${id}/suspend`, { reason });
    return response.data;
};

export const unsuspendUser = async (id) => {
    const response = await api.post(`/admin/users/${id}/unsuspend`);
    return response.data;
};

export const getAllTransactions = async () => {
    const response = await api.get('/admin/transactions');
    return response.data;
};

export const resolveDispute = async (id, action, resolution) => {
    const response = await api.post(`/admin/transactions/${id}/resolve`, { action, resolution });
    return response.data;
};

export const getAuditLogs = async (filters = {}) => {
    const response = await api.get('/admin/audit-logs', { params: filters });
    return response.data;
};
