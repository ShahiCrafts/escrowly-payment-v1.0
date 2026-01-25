import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount, currency = 'NPR') => {
    const currencyUpper = (currency || 'NPR').toUpperCase();

    if (currencyUpper === 'NPR') {
        return `Rs. ${new Intl.NumberFormat('en-NP', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)}`;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyUpper
    }).format(amount);
};

export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(date);
};

export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const getStatusColor = (status) => {
    const colors = {
        draft: 'bg-gray-100 text-gray-800',
        awaiting_payment: 'bg-yellow-100 text-yellow-800',
        funded: 'bg-blue-100 text-blue-800',
        released: 'bg-green-100 text-green-800',
        disputed: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
        completed: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status) => {
    const labels = {
        draft: 'Draft',
        awaiting_payment: 'Awaiting Payment',
        funded: 'Funded',
        released: 'Released',
        disputed: 'Disputed',
        cancelled: 'Cancelled',
        completed: 'Completed'
    };
    return labels[status] || status;
};

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    const errors = [];
    if (password.length < 12) errors.push('At least 12 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character');
    return { valid: errors.length === 0, errors };
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};
