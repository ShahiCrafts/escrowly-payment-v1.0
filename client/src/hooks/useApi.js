import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { immediate = true, method = 'GET' } = options;

    const execute = useCallback(async (body = null) => {
        setLoading(true);
        setError(null);

        try {
            const config = {
                method,
                url: endpoint
            };

            if (body) {
                config.data = body;
            }

            const response = await api(config);
            setData(response.data);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [endpoint, method]);

    useEffect(() => {
        if (immediate && method === 'GET') {
            execute();
        } else {
            setLoading(false);
        }
    }, [execute, immediate, method]);

    return { data, loading, error, execute, refetch: execute };
};

export const useTransactions = () => {
    return useApi('/escrow');
};

export const useTransaction = (id) => {
    return useApi(`/escrow/${id}`);
};

export const useAdminUsers = () => {
    return useApi('/admin/users');
};

export const useAdminTransactions = () => {
    return useApi('/admin/transactions');
};

export const useAuditLogs = () => {
    return useApi('/admin/audit-logs');
};
