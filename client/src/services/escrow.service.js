import api from './api';

export const createTransaction = async (data) => {
    const response = await api.post('/escrow', data);
    return response.data;
};

export const getTransactions = async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/escrow', { params });
    return response.data;
};

export const getTransactionById = async (id) => {
    const response = await api.get(`/escrow/${id}`);
    return response.data;
};

export const getTransactionStats = async () => {
    const response = await api.get('/escrow/stats');
    return response.data;
};

export const acceptTransaction = async (id) => {
    const response = await api.post(`/escrow/${id}/accept`);
    return response.data;
};

export const markAsDelivered = async (id) => {
    const response = await api.post(`/escrow/${id}/deliver`);
    return response.data;
};

export const releaseFunds = async (id) => {
    const response = await api.post(`/escrow/${id}/release`);
    return response.data;
};

export const raiseDispute = async (id, reason) => {
    const response = await api.post(`/escrow/${id}/dispute`, { reason });
    return response.data;
};

export const cancelTransaction = async (id, reason) => {
    const response = await api.post(`/escrow/${id}/cancel`, { reason });
    return response.data;
};

export const createPaymentIntent = async (transactionId) => {
    const response = await api.post(`/payments/${transactionId}/create-intent`);
    return response.data;
};

export const getOnboardingStatus = async () => {
    const response = await api.get('/payments/onboarding/status');
    return response.data;
};

export const createOnboardingLink = async () => {
    const response = await api.post('/payments/onboarding');
    return response.data;
};
